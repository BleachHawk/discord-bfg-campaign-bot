
import { eq } from "drizzle-orm";
import { db } from "./db";
import {
  sectors,
  subsectors,
  systems,
  campaigns,
  factions,
  battles,
} from "./schema";

// -------------------------
// CAMPAIGNS
// -------------------------

export async function addCampaign(
  data: typeof campaigns.$inferInsert,
) {
  const [result] = await db
    .insert(campaigns)
    .values(data)
    .returning();

  return result;
}

export async function getCampaigns() {
  return db.select().from(campaigns);
}

export async function getCampaignById(id: number) {
  const [result] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.campaign_ID, id))
    .limit(1);

  return result;
}

export async function getCampaignByDiscord(discord: string) {
  const [result] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.campaign_discord, discord))
    .limit(1);

  return result;
}

export async function getCampaignDetails(id: number) {
  const [result] = await db
    .select({
      campaign: campaigns,
      subsector: subsectors,
      sector: sectors,
    })
    .from(campaigns)
    .leftJoin(
      subsectors,
      eq(
        campaigns.campaign_sector_ID,
        subsectors.subsector_ID,
      ),
    )
    .leftJoin(
      sectors,
      eq(subsectors.sector_ID, sectors.sector_ID),
    )
    .where(eq(campaigns.campaign_ID, id))
    .limit(1);

  return result;
}

// -------------------------
// SECTORS
// -------------------------

export async function addSector(
  data: typeof sectors.$inferInsert,
) {
  const [result] = await db
    .insert(sectors)
    .values(data)
    .returning();

  return result;
}

export async function getSectors() {
  return db.select().from(sectors);
}

export async function getSectorById(id: number) {
  const [result] = await db
    .select()
    .from(sectors)
    .where(eq(sectors.sector_ID, id))
    .limit(1);

  return result;
}

// -------------------------
// SUBSECTORS
// -------------------------

export async function addSubsector(
  data: typeof subsectors.$inferInsert,
) {
  const [result] = await db
    .insert(subsectors)
    .values(data)
    .returning();

  return result;
}

export async function getSubsectors() {
  return db.select().from(subsectors);
}

export async function getSubsectorsBySectorId(
  sectorId: number,
) {
  return db
    .select()
    .from(subsectors)
    .where(eq(subsectors.sector_ID, sectorId));
}

export async function getSubsectorById(id: number) {
  const [result] = await db
    .select()
    .from(subsectors)
    .where(eq(subsectors.subsector_ID, id))
    .limit(1);

  return result;
}

// -------------------------
// SYSTEMS
// -------------------------

export async function addSystem(
  data: typeof systems.$inferInsert,
) {
  const [result] = await db
    .insert(systems)
    .values(data)
    .returning();

  return result;
}

export async function getSystem() {
  return db.select().from(systems);
}

export async function getSystemsBySubsectorId(
  subsectorId: number,
) {
  return db
    .select()
    .from(systems)
    .where(eq(systems.subsector_ID, subsectorId));
}

export async function getSystemById(id: number) {
  const [result] = await db
    .select()
    .from(systems)
    .where(eq(systems.system_ID, id))
    .limit(1);

  return result;
}

export async function getSystemByName(name: string) {
  const [result] = await db
    .select()
    .from(systems)
    .where(eq(systems.system_name, name))
    .limit(1);

  return result;
}



// -------------------------
// FACTIONS
// -------------------------

export async function addFaction(
  data: typeof factions.$inferInsert,
) {
  const [result] = await db
    .insert(factions)
    .values(data)
    .returning();

  return result;
}

export async function getFactions() {
  return db.select().from(factions);
}

export async function getFactionById(id: number) {
  const [result] = await db
    .select()
    .from(factions)
    .where(eq(factions.faction_ID, id))
    .limit(1);

  return result;
}

export async function getFactionByName(name: string) {
  const [result] = await db
    .select()
    .from(factions)
    .where(eq(factions.faction_name, name))
    .limit(1);

  return result;
}

// -------------------------
// BATTLES
// -------------------------

export async function addBattle(
  data: typeof battles.$inferInsert,
) {
  const [result] = await db
    .insert(battles)
    .values(data)
    .returning();

  console.log("Battle added: " + result.battle_ID);
  return result;
}

export async function getBattles() {
  return db.select().from(battles);
}

export async function getBattlesByCampaignId(
  campaignId: number,
) {
  return db
    .select()
    .from(battles)
    .where(eq(battles.campaign_ID, campaignId));
}

export async function getBattleById(id: number) {
  const [result] = await db
    .select()
    .from(battles)
    .where(eq(battles.battle_ID, id))
    .limit(1);

  return result;
}