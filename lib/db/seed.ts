import { and, eq } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import path from 'node:path';

import { stripe } from '../payments/stripe';
import { client, db } from './drizzle';
import {
  users,
  teams,
  teamMembers,
  suppliers,
  ingredients,
  recipes,
  recipeItems,
  salesPlans,
  salesPlanItems,
} from './schema';
import { hashPassword } from '@/lib/auth/session';

async function ensureStripeProducts() {
  if (process.env.SKIP_STRIPE_SEED === '1') {
    console.log('Skipping Stripe setup (SKIP_STRIPE_SEED=1).');
    return;
  }

  try {
    console.log('Ensuring Stripe products and prices exist...');
    const existing = await stripe.products.list({ limit: 1 });
    if (existing.data.length > 0) {
      console.log('Stripe products already configured. Skipping creation.');
      return;
    }
  } catch (error) {
    console.warn(
      'Unable to verify Stripe products. Continuing without seeding Stripe.\nSet SKIP_STRIPE_SEED=1 to silence this message.',
      error instanceof Error ? error.message : error,
    );
    return;
  }

  try {
    const baseProduct = await stripe.products.create({
      name: 'Base',
      description: 'Base subscription plan',
    });

    await stripe.prices.create({
      product: baseProduct.id,
      unit_amount: 800,
      currency: 'usd',
      recurring: {
        interval: 'month',
        trial_period_days: 7,
      },
    });

    const plusProduct = await stripe.products.create({
      name: 'Plus',
      description: 'Plus subscription plan',
    });

    await stripe.prices.create({
      product: plusProduct.id,
      unit_amount: 1200,
      currency: 'usd',
      recurring: {
        interval: 'month',
        trial_period_days: 7,
      },
    });

    console.log('Stripe products and prices created successfully.');
  } catch (error) {
    console.warn(
      'Failed to create Stripe products. Continuing with local seed data.',
      error instanceof Error ? error.message : error,
    );
  }
}

async function seedTeamUser() {
  const email = 'test@test.com';
  const password = 'admin123';
  const passwordHash = await hashPassword(password);

  console.log('Seeding base user/team...');
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    console.log('User already exists. Skipping creation.');
    const teamMember = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, existingUser.id),
      with: {
        team: true,
      },
    });
    return {
      userId: existingUser.id,
      teamId: teamMember?.teamId ?? 1,
    };
  }

  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      role: 'owner',
    })
    .returning();

  const [team] = await db
    .insert(teams)
    .values({
      name: 'Test Team',
    })
    .returning();

  await db.insert(teamMembers).values({
    teamId: team.id,
    userId: user.id,
    role: 'owner',
  });

  return { userId: user.id, teamId: team.id };
}

async function seedCatalog(teamId: number) {
  console.log('Seeding catalog domain data...');

  const [supplier] = await db
    .insert(suppliers)
    .values({
      teamId,
      name: 'デフォルト食材卸',
      leadTimeDays: 2,
    })
    .onConflictDoNothing()
    .returning();

  const supplierId =
    supplier?.id ??
    (
      await db.query.suppliers.findFirst({
        where: eq(suppliers.teamId, teamId),
      })
    )?.id;

  if (!supplierId) {
    throw new Error('Failed to create or locate supplier seed.');
  }

  const [chicken] = await db
    .insert(ingredients)
    .values({
      teamId,
      name: '鶏もも肉',
      purchaseUnit: 'kg',
      purchaseQty: '1.000',
      purchasePriceMinor: 980,
      taxIncluded: true,
      taxRate: '10.00',
      stockUnit: 'g',
      convPurchaseToStock: '1000.000000',
      yieldRate: '90.00',
      supplierId,
    })
    .onConflictDoNothing()
    .returning();

  const [onion] = await db
    .insert(ingredients)
    .values({
      teamId,
      name: '玉ねぎ',
      purchaseUnit: 'kg',
      purchaseQty: '1.000',
      purchasePriceMinor: 198,
      taxIncluded: true,
      taxRate: '10.00',
      stockUnit: 'g',
      convPurchaseToStock: '1000.000000',
      yieldRate: '92.00',
      supplierId,
    })
    .onConflictDoNothing()
    .returning();

  const chickenId =
    chicken?.id ??
    (
      await db.query.ingredients.findFirst({
        where: and(
          eq(ingredients.teamId, teamId),
          eq(ingredients.name, '鶏もも肉'),
        ),
      })
    )?.id;

  const onionId =
    onion?.id ??
    (
      await db.query.ingredients.findFirst({
        where: and(
          eq(ingredients.teamId, teamId),
          eq(ingredients.name, '玉ねぎ'),
        ),
      })
    )?.id;

  if (!chickenId || !onionId) {
    throw new Error('Failed to seed base ingredients.');
  }

  const [recipe] = await db
    .insert(recipes)
    .values({
      teamId,
      name: 'チキンカレー',
      batchOutputQty: '2000.000',
      batchOutputUnit: 'g',
      servingSizeQty: '200.000',
      servingSizeUnit: 'g',
      platingYieldRate: '100.00',
      sellingPriceMinor: 950,
      sellingPriceTaxIncluded: true,
      sellingTaxRate: '10.00',
    })
    .onConflictDoNothing()
    .returning();

  const recipeId =
    recipe?.id ??
    (
      await db.query.recipes.findFirst({
        where: and(eq(recipes.teamId, teamId), eq(recipes.name, 'チキンカレー')),
      })
    )?.id;

  if (!recipeId) {
    throw new Error('Failed to seed recipe.');
  }

  await db
    .insert(recipeItems)
    .values([
      {
        recipeId,
        ingredientId: chickenId,
        qty: '1200.000',
        unit: 'g',
        wasteRate: '0.0300',
      },
      {
        recipeId,
        ingredientId: onionId,
        qty: '500.000',
        unit: 'g',
        wasteRate: '0.0200',
      },
    ])
    .onConflictDoNothing();

  const existingPlan = await db.query.salesPlans.findFirst({
    where: and(
      eq(salesPlans.teamId, teamId),
      eq(salesPlans.name, 'チキンカレー販売計画'),
    ),
  });

  if (!existingPlan) {
    const [plan] = await db
      .insert(salesPlans)
      .values({
        teamId,
        name: 'チキンカレー販売計画',
        startDate: '2024-01-01',
        endDate: '2024-01-07',
      })
      .returning();

    await db.insert(salesPlanItems).values({
      salesPlanId: plan.id,
      recipeId,
      servings: 30,
    });
  }
}

async function runMigrations() {
  console.log('Running database migrations...');
  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), 'lib/db/migrations'),
  });
  console.log('Migrations completed.');
}

async function seed() {
  await runMigrations();
  const { teamId } = await seedTeamUser();
  await seedCatalog(teamId);
  await ensureStripeProducts();
}

async function main() {
  try {
    await seed();
    console.log('Seed process completed successfully.');
  } catch (error) {
    console.error('Seed process failed:', error);
    process.exitCode = 1;
  } finally {
    console.log('Closing database connection...');
    await client.end({ timeout: 5 }).catch((endError) => {
      console.warn('Failed to close database connection cleanly:', endError);
    });
    console.log('Seed process finished. Exiting...');
  }
}

main();
