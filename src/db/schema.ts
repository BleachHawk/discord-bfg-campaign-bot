import { relations } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const campaigns = sqliteTable("campaigns", {
  campaign_ID: integer("campaign_ID").primaryKey(),
  campaign_discord: text("campaign_discord").notNull(),
  campaign_name: text("campaign_name").notNull(),
  campaign_sector_ID: integer("campaign_sector_ID")
    .references(() => sectors.sector_ID),
  campaign_startDate: text("campaign_startDate"),
});

export const sectors = sqliteTable("sectors", {
  sector_ID: integer("sector_ID").primaryKey(),
  sector_name: text("sector_name").notNull(),
});

export const subsectors = sqliteTable("subsectors", {
  subsector_ID: integer("subsector_ID").primaryKey(),
  subsector_name: text("subsector_name").notNull(),
  description: text("description"),
  polygon_points: text("polygon_points", { mode: "json" })
    .$type<[number, number][]>()
    .notNull()
    .default([]),
  sector_ID: integer("sector_ID")
    .notNull()
    .references(() => sectors.sector_ID),
});

export const systems = sqliteTable("systems", {
  system_ID: integer("system_ID").primaryKey(),
  system_name: text("system_name").notNull(),
  location_x: integer("location_x").primaryKey(),
  location_y: integer("location_y").primaryKey(),
  description: text("description"),
  type: text("type"),
  currentFaction: text("currentFaction"),
  subsector_ID: integer("subsector_ID")
    .notNull()
    .references(() => subsectors.subsector_ID),
});

export const factions = sqliteTable("factions", {
  faction_ID: integer("faction_ID").primaryKey(),
  faction_name: text("faction_name").notNull(),
  short_name: text("short_name").notNull(),
});

export const battles = sqliteTable("battles", {
  battle_ID: integer("battle_ID").primaryKey(),
  campaign_ID: integer("campaign_ID")
    .notNull()
    .references(() => campaigns.campaign_ID),
  battle_system: integer("battle_system"),
  battle_faction1: integer("battle_faction1")
    .references(() => factions.faction_ID),
  battle_faction2: integer("battle_faction2")
    .references(() => factions.faction_ID),
  battle_points: integer("battle_points"),
  battle_player1: text("battle_player1"),
  battle_player2: text("battle_player2"),
  battle_victoryPoints1: integer("battle_victoryPoints1")
    .notNull()
    .default(0),
  battle_victoryPoints2: integer("battle_victoryPoints2")
    .notNull()
    .default(0),
  battle_report: text("battle_report"),
  battle_author: text("battle_author"),
});

export const campaignsRelations = relations(campaigns, ({ one }) => ({
  sector: one(sectors, {
    fields: [campaigns.campaign_sector_ID],
    references: [sectors.sector_ID],
  }),
}));

export const sectorsRelations = relations(sectors, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [sectors.sector_ID],
    references: [campaigns.campaign_sector_ID],
  }),
  subsectors: many(subsectors),
}));

export const subsectorsRelations = relations(subsectors, ({ one, many }) => ({
  sector: one(sectors, {
    fields: [subsectors.sector_ID],
    references: [sectors.sector_ID],
  }),
  systems: many(systems),
}));

export const systemsRelations = relations(systems, ({ one }) => ({
  subsector: one(subsectors, {
    fields: [systems.subsector_ID],
    references: [subsectors.subsector_ID],
  }),
}));