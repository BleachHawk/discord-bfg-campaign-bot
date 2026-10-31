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

export async function initializeDatabase(): Promise<void> {
  await client.batch([
    {
      sql: `CREATE TABLE IF NOT EXISTS sectors (
        sector_ID INTEGER PRIMARY KEY,
        sector_name TEXT NOT NULL
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS subsectors (
        subsector_ID INTEGER PRIMARY KEY,
        subsector_name TEXT NOT NULL,
        description TEXT NOT NULL,
        polygon_points TEXT NOT NULL DEFAULT '[]'
          CHECK (json_valid(polygon_points)),
        sector_ID INTEGER NOT NULL,
        UNIQUE (sector_ID, subsector_name),
        FOREIGN KEY (sector_ID) REFERENCES sectors(sector_ID)
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS systems (
        system_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        location_x INTEGER NOT NULL,
        location_y INTEGER NOT NULL,
        system_name TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        subsector_ID INTEGER NOT NULL,
        FOREIGN KEY (subsector_ID) REFERENCES subsectors(subsector_ID)
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS campaigns (
        campaign_ID INTEGER PRIMARY KEY,
        campaign_name TEXT NOT NULL,
        campaign_discord TEXT NOT NULL,
        campaign_sector_ID INTEGER,
        campaign_startDate TEXT,
        FOREIGN KEY (campaign_sector_ID)
          REFERENCES sectors(sector_ID)
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS factions (
        faction_ID INTEGER PRIMARY KEY,
        faction_name TEXT NOT NULL,
        short_name TEXT NOT NULL,
        composite TEXT DEFAULT NULL
          CHECK (composite IS NULL OR json_valid(composite))
      )`,
      args: [],
    },
    {
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
        FOREIGN KEY (campaign_ID)
          REFERENCES campaigns(campaign_ID),
        FOREIGN KEY (battle_faction1)
          REFERENCES factions(faction_ID),
        FOREIGN KEY (battle_faction2)
          REFERENCES factions(faction_ID)
      )`,
      args: [],
    },
  ], "write");

  // Enable foreign-key enforcement for this connection.
  await client.execute("PRAGMA foreign_keys = ON");

  console.log("DB: created");

  const c = await dbQueries.getCampaigns();
  if (c && c.length > 0) {
    console.log("DB: campaign found, skip initializing database")
    return;
  }

  initializeDatabaseData();
}

export async function initializeDatabaseData() {
  for (var sector in initData.sectors) {
    await dbQueries.addSector(initData.sectors[sector]);
  }

  for (var subsector in initData.subsectors) {
    await dbQueries.addSubsector(initData.subsectors[subsector] as {
      subsector_ID: number;
      subsector_name: string;
      sector_ID: number;
      polygon_points: [number, number][];
      description: string;
    });
  }

  for (var system in initData.systems) {
    await dbQueries.addSystem(initData.systems[system]);
  }

  for (var faction in initData.factions) {
    await dbQueries.addFaction(initData.factions[faction]);
  }

  for (var campaign in initData.campaigns) {
    await dbQueries.addCampaign(initData.campaigns[campaign]);
  }

  // test data
  for (var battle in initData.battles) {
    await dbQueries.addBattle(initData.battles[battle]);
  }

  console.log("DB: initial data created");
}