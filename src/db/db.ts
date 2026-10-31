import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import * as dbQueries from "./queries";
import initData from './init.json';

const dbFile = process.env.DB_FILE_NAME;
if (!dbFile) {
  console.error("No db file name in .env");
}
export const client = createClient({
  url: dbFile!,
  authToken: process.env.TURSO_TOKEN!
});

export const db = drizzle(client, { schema });

async function logDbAction<T>(
  description: string,
  action: () => Promise<T>
): Promise<T> {
  // console.log(`[DB] START: ${description}`);

  try {
    const result = await action();
    // console.log(`[DB] SUCCESS: ${description}`);
    return result;
  } catch (error) {
    console.error(`[DB] FAILED: ${description}`);
    console.error(error);
    throw error;
  }
}

export async function initializeDatabase(): Promise<void> {
  console.log("[DB] Starting database initialization");

  const statements = [
    {
      name: "Create sectors table",
      sql: `CREATE TABLE IF NOT EXISTS sectors (
                sector_ID INTEGER PRIMARY KEY,
                sector_name TEXT NOT NULL
            )`
    },
    {
      name: "Create subsectors table",
      sql: `CREATE TABLE IF NOT EXISTS subsectors (
                subsector_ID INTEGER PRIMARY KEY,
                subsector_name TEXT NOT NULL,
                description TEXT NOT NULL,
                polygon_points TEXT NOT NULL DEFAULT '[]'
                    CHECK (json_valid(polygon_points)),
                sector_ID INTEGER NOT NULL,
                UNIQUE (sector_ID, subsector_name),
                FOREIGN KEY (sector_ID) REFERENCES sectors(sector_ID)
            )`
    },
    {
      name: "Create systemTypes table",
      sql: `CREATE TABLE IF NOT EXISTS systemTypes (
                system_type_ID INTEGER PRIMARY KEY,
                system_type_name TEXT NOT NULL,
                short_name TEXT NOT NULL,
                description TEXT NOT NULL,
                importance INTEGER NOT NULL
            )`
    },
    {
      name: "Create systems table",
      sql: `CREATE TABLE IF NOT EXISTS systems (
                system_ID INTEGER PRIMARY KEY AUTOINCREMENT,
                location_x INTEGER NOT NULL,
                location_y INTEGER NOT NULL,
                system_name TEXT NOT NULL,
                description TEXT NOT NULL,
                system_type_ID INTEGER NOT NULL,
                subsector_ID INTEGER NOT NULL,
                FOREIGN KEY (system_type_ID) REFERENCES systemTypes(system_type_ID),
                FOREIGN KEY (subsector_ID) REFERENCES subsectors(subsector_ID)
            )`
    },
    {
      name: "Create campaigns table",
      sql: `CREATE TABLE IF NOT EXISTS campaigns (
                campaign_ID INTEGER PRIMARY KEY,
                campaign_name TEXT NOT NULL,
                campaign_discord TEXT NOT NULL,
                campaign_sector_ID INTEGER,
                campaign_startDate TEXT,
                FOREIGN KEY (campaign_sector_ID)
                    REFERENCES sectors(sector_ID)
            )`
    },
    {
      name: "Create factions table",
      sql: `CREATE TABLE IF NOT EXISTS factions (
                faction_ID INTEGER PRIMARY KEY,
                faction_name TEXT NOT NULL,
                short_name TEXT NOT NULL,
                composite TEXT DEFAULT NULL
                    CHECK (composite IS NULL OR json_valid(composite))
            )`
    },
    {
      name: "Create battles table",
      sql: `CREATE TABLE IF NOT EXISTS battles (
                battle_ID INTEGER PRIMARY KEY AUTOINCREMENT,
                campaign_ID INTEGER NOT NULL,
                battle_system INTEGER,
                battle_faction1 INTEGER,
                battle_faction2 INTEGER,
                battle_points INTEGER,
                battle_player1 TEXT,
                battle_player2 TEXT,
                battle_report TEXT,
                battle_author TEXT,
                battle_victoryPoints1 INTEGER NOT NULL DEFAULT 0,
                battle_victoryPoints2 INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (campaign_ID) REFERENCES campaigns(campaign_ID),
                FOREIGN KEY (battle_faction1) REFERENCES factions(faction_ID),
                FOREIGN KEY (battle_faction2) REFERENCES factions(faction_ID)
            )`
    }
  ];

  for (const statement of statements) {
    await logDbAction(statement.name, async() => {
      try {
         const result = await client.execute(statement.sql);
         return result;
      } catch (error) {
        console.error("[DB] SQL:", statement.sql);
        console.error("[DB] Error:", error);
        throw error;
      }
    });
  }

  await logDbAction("Enable foreign keys", () =>
    client.execute("PRAGMA foreign_keys = ON")
  );

  console.log("[DB] Table creation complete");

  const c = await logDbAction("Check existing campaigns", () =>
    dbQueries.getCampaigns()
  );

  if (c && c.length > 0) {
    console.log("[DB] Campaign found, skipping data initialization");
    return;
  }

  await initializeDatabaseData();
}

export async function initializeDatabaseData() {
  console.log("[DB] Starting initial data insertion");

  for (const sector of Object.values(initData.sectors)) {
    await logDbAction(`Insert sector: ${sector.sector_name}`, () =>
      dbQueries.addSector(sector)
    );
  }

  for (const subsector of Object.values(initData.subsectors)) {
    await logDbAction(`Insert subsector: ${subsector.subsector_name}`, () =>
      dbQueries.addSubsector(subsector)
    );
  }

  for (const systemType of Object.values(initData.system_types)) {
    await logDbAction(`Insert system type: ${systemType.system_type_name}`, () =>
      dbQueries.addSystemType(systemType)
    );
  }

  for (const system of Object.values(initData.systems)) {
    await logDbAction(`Insert system: ${system.system_name}`, () =>
      dbQueries.addSystem(system)
    );
  }

  for (const faction of Object.values(initData.factions)) {
    await logDbAction(`Insert faction: ${faction.faction_name}`, () =>
      dbQueries.addFaction(faction)
    );
  }

  for (const campaign of Object.values(initData.campaigns)) {
    await logDbAction(`Insert campaign: ${campaign.campaign_name}`, () =>
      dbQueries.addCampaign(campaign)
    );
  }

  for (const battle of Object.values(initData.battles)) {
    await logDbAction(`Insert battle: ${battle.battle_ID}`, () =>
      dbQueries.addBattle(battle)
    );
  }

  console.log("[DB] Initial data created successfully");
}