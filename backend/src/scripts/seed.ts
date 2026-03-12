import mysql from "mysql2/promise";
import { achievements, dailyChallenges, lessons } from "../services/seedData"; 
// adjust path if your arrays are in another file

export async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "stocksim",
  });

  try {
    console.log("Starting database seed...");

    // Disable foreign key checks
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    console.log("Truncating tables...");
    await connection.query("TRUNCATE TABLE achievements");
    await connection.query("TRUNCATE TABLE daily_challenges");
    await connection.query("TRUNCATE TABLE lessons");

    // Enable foreign key checks
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("Tables truncated successfully.");

    /*
    ========================
    Insert Achievements
    ========================
    */

    console.log("Seeding achievements...");

    const achievementValues = achievements.map((a) => [
      a.name,
      a.description,
      a.icon,
      a.xp_reward,
      a.criteria_type,
      a.criteria_value,
    ]);

    await connection.query(
      `
      INSERT INTO achievements
      (name, description, icon, xp_reward, criteria_type, criteria_value)
      VALUES ?
      `,
      [achievementValues]
    );

    console.log(`Inserted ${achievementValues.length} achievements`);

    /*
    ========================
    Insert Daily Challenges
    ========================
    */

    console.log("Seeding daily challenges...");

    const challengeValues = dailyChallenges.map((c) => [
      c.title,
      c.description,
      c.type,
      c.target,
      c.xp_reward,
    ]);

    await connection.query(
      `
      INSERT INTO daily_challenges
      (title, description, type, target, xp_reward)
      VALUES ?
      `,
      [challengeValues]
    );

    console.log(`Inserted ${challengeValues.length} daily challenges`);

    /*
    ========================
    Insert Lessons
    ========================
    */

    console.log("Seeding lessons...");

    const lessonValues = lessons.map((lesson) => [
      lesson.title,
      lesson.description,
      lesson.category,
      lesson.difficulty,
      lesson.xp_reward,
      lesson.duration_minutes,
      lesson.order_index,
      lesson.prerequisite_id || null,
      JSON.stringify(lesson.content),
    ]);

    await connection.query(
      `
      INSERT INTO lessons
      (
        title,
        description,
        category,
        difficulty,
        xp_reward,
        duration_minutes,
        order_index,
        prerequisite_id,
        content
      )
      VALUES ?
      `,
      [lessonValues]
    );

    console.log(`Inserted ${lessonValues.length} lessons`);

    console.log("Database seeding completed successfully 🎉");
  } catch (err) {
    console.error("Seed failed:", err);
  } finally {
    await connection.end();
  }
}
