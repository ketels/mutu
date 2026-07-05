import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { addDays, todayISO } from "./lib/dates";

const crons = cronJobs();

// 07:00 svensk sommartid (05:00 UTC). Vintertid blir 06:00 — gott nog för v1.
crons.daily(
  "return reminders",
  { hourUTC: 5, minuteUTC: 0 },
  internal.crons.sendReminders,
  {},
);

export const sendReminders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const today = todayISO();
    const tomorrow = addDays(today, 1);
    const yesterday = addDays(today, -1);

    // Approved-lån är få nog att gå igenom utan datumindex i v1
    const loans = await ctx.db.query("loans").collect();
    for (const loan of loans) {
      if (loan.status !== "approved" || loan.returnedAt !== undefined)
        continue;
      const kind =
        loan.endDay === tomorrow
          ? "return_tomorrow"
          : loan.endDay === today
            ? "return_today"
            : loan.endDay === yesterday
              ? "overdue"
              : null;
      if (!kind) continue;
      await ctx.scheduler.runAfter(0, internal.emails.loanEvent, {
        loanId: loan._id,
        kind,
      });
      if (kind === "overdue") {
        await ctx.db.insert("messages", {
          loanId: loan._id,
          kind: "system",
          body: "Påminnelse: lånet skulle ha lämnats tillbaka igår",
        });
      }
    }
  },
});

export default crons;
