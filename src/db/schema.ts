import { relations } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const campaigns = sqliteTable("campaigns", {
  campaign_ID: integer("campaign_ID").primaryKey(),
  campaign_discord: text("campaign_discord").notNull(),
  campaign_name: text("campaign_name").notNull(),
  campaign_startDate: text("campaign_startDate"),
});

export const campaignPhases = sqliteTable("campaignPhases", {
  campaign_phase_ID: integer("campaign_phase_ID").primaryKey(),
  name: text("name").notNull().default(''),
  runtime: text("runtime").notNull().default('month'),
  objective: text("objective").notNull().default(''),
  description: text("description").notNull().default(''),
  battle_size: text("battle_size").notNull().default(''),
  campaign_ID: integer("campaign_ID")
    .notNull()
    .references(() => campaigns.campaign_ID),
});

export const sectors = sqliteTable("sectors", {
  sector_ID: integer("sector_ID").primaryKey(),
  sector_name: text("sector_name").notNull(),
  campaign_ID: integer("campaign_ID")
    .notNull()
    .unique()
    .references(() => campaigns.campaign_ID),
});

export const subsectors = sqliteTable("subsectors", {
  subsector_ID: integer("subsector_ID").primaryKey(),
  subsector_name: text("subsector_name").notNull(),
  description: text("description").notNull().default(''),
  polygon_points: text("polygon_points", { mode: "json" })
    .$type<[number, number][]>()
    .notNull()
    .default([]),
  sector_ID: integer("sector_ID")
    .notNull()
    .references(() => sectors.sector_ID),
});

export const systemTypes = sqliteTable("systemTypes", {
  system_type_ID: integer("system_type_ID").primaryKey(),
  system_type_name: text("system_type_name").notNull(),
  description: text("description").notNull().default(''),
  short_name: text("short_name").notNull(),
  importance: integer("importance").notNull(),
});

export const systems = sqliteTable("systems", {
  system_ID: integer("system_ID").primaryKey(),
  system_name: text("system_name").notNull(),
  location_x: integer("location_x"),
  location_y: integer("location_y"),
  description: text("description").notNull().default(''),
  // TODO: add modifiers (moon, asteroid, asteroid_field, station, ...)?
  system_type_ID: integer("system_type_ID")
    .notNull()
    .references(() => systemTypes.system_type_ID),
  // TODO: add world types (ice, ocean, desert, ...) with modifiers (death, ...)? 
  // system_world_type_ID: integer()
  //   .notNull()
  //   .references(() => systemWorldTypes.system_world_type_ID),
  subsector_ID: integer("subsector_ID")
    .notNull()
    .references(() => subsectors.subsector_ID),
});

export const factions = sqliteTable("factions", {
  faction_ID: integer("faction_ID").primaryKey(),
  faction_name: text("faction_name").notNull(),
  short_name: text("short_name").notNull(),
  composite: text("composite", { mode: "json" })
    .$type<number[]>()
});

export const battles = sqliteTable("battles", {
  battle_ID: integer("battle_ID").primaryKey(),
  campaign_ID: integer("campaign_ID")
    .notNull()
    .references(() => campaigns.campaign_ID),
  battle_system: integer("battle_system").notNull(),
  battle_faction1: integer("battle_faction1").notNull()
    .references(() => factions.faction_ID),
  battle_faction2: integer("battle_faction2").notNull()
    .references(() => factions.faction_ID),
  battle_points: integer("battle_points").notNull(),
  battle_player1: text("battle_player1"),
  battle_player2: text("battle_player2"),
  battle_victoryPoints1: integer("battle_victoryPoints1")
    .notNull()
    .default(0),
  battle_victoryPoints2: integer("battle_victoryPoints2")
    .notNull()
    .default(0),
  battle_report: text("battle_report"),
  battle_author: text("battle_author").notNull(),
});

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  sector: one(sectors, {
    fields: [campaigns.campaign_ID],
    references: [sectors.campaign_ID],
  }),
  battles: many(battles),
  campaignPhases: many(campaignPhases),
}));

export const sectorsRelations = relations(sectors, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [sectors.campaign_ID],
    references: [campaigns.campaign_ID],
  }),
  subsectors: many(subsectors),
}));

export const campaignPhasesRelations = relations(campaignPhases, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignPhases.campaign_ID],
    references: [campaigns.campaign_ID],
  }),
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
  systemType: one(systemTypes, {
    fields: [systems.system_type_ID],
    references: [systemTypes.system_type_ID],
  }),
}));

export const systemTypesRelations = relations(systemTypes, ({ many }) => ({
  systems: many(systems),
}));

export const battlesRelations = relations(battles, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [battles.campaign_ID],
    references: [campaigns.campaign_ID],
  }),
}));