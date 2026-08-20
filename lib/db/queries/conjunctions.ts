import { db } from "@/lib/db"
import { conjunctionEvents, debrisObjects } from "@/lib/db/schema"
import { desc, eq, and, gte } from "drizzle-orm"

import { aliasedTable } from "drizzle-orm"

export async function getActiveConjunctions() {
  const obj1 = aliasedTable(debrisObjects, 'obj1')
  const obj2 = aliasedTable(debrisObjects, 'obj2')

  return db
    .select({
      id: conjunctionEvents.id,
      timeOfClosestApproach: conjunctionEvents.timeOfClosestApproach,
      missDistanceKm: conjunctionEvents.missDistanceKm,
      collisionProbability: conjunctionEvents.collisionProbability,
      severity: conjunctionEvents.severity,
      object1Name: obj1.name,
      object1NoradId: obj1.noradId,
      object2Name: obj2.name,
      object2NoradId: obj2.noradId,
    })
    .from(conjunctionEvents)
    .innerJoin(obj1, eq(conjunctionEvents.object1Id, obj1.id))
    .innerJoin(obj2, eq(conjunctionEvents.object2Id, obj2.id))
    .where(
      and(
        eq(conjunctionEvents.isResolved, false),
        gte(conjunctionEvents.timeOfClosestApproach, new Date())
      )
    )
    .orderBy(desc(conjunctionEvents.collisionProbability))
}

export async function insertConjunctionEvent(
  data: typeof conjunctionEvents.$inferInsert
) {
  return db.insert(conjunctionEvents).values(data)
}
