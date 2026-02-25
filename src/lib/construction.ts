/**
 * Construction pay math: OT calculation, schedule parsing, per diem weekly.
 * Handles the structural difference vs healthcare:
 *   Healthcare: bundled weekly gross → split into stipend + taxable
 *   Construction: hourly rate + daily per diem → compute weekly gross with OT
 */

export type ConstructionSchedule =
  | "4x10"
  | "5x8"
  | "5x10"
  | "6x10"
  | "7x12"
  | "custom";
export type HousingModel = "self" | "company";

export interface ConstructionInput {
  hourly_rate: number;
  daily_per_diem: number;
  per_diem_days: 5 | 6 | 7;
  schedule: ConstructionSchedule;
  custom_hours?: number;
  housing_model: HousingModel;
}

export interface ConstructionBreakdown {
  straight_hours: number;
  ot_hours: number;
  straight_pay: number;
  ot_pay: number;
  weekly_wage: number;
  weekly_per_diem: number;
  weekly_gross_total: number;
  total_hours: number;
}

/** Parse schedule string into total weekly hours */
export function scheduleToHours(
  schedule: ConstructionSchedule,
  custom?: number,
): number {
  switch (schedule) {
    case "4x10":
      return 40;
    case "5x8":
      return 40;
    case "5x10":
      return 50;
    case "6x10":
      return 60;
    case "7x12":
      return 84;
    case "custom":
      return custom ?? 50;
    default:
      return 50;
  }
}

/** Schedule display label */
export function scheduleLabel(schedule: ConstructionSchedule): string {
  switch (schedule) {
    case "4x10":
      return "4×10 (40hr)";
    case "5x8":
      return "5×8 (40hr)";
    case "5x10":
      return "5×10 (50hr)";
    case "6x10":
      return "6×10 (60hr)";
    case "7x12":
      return "7×12 (84hr)";
    case "custom":
      return "Custom";
    default:
      return schedule;
  }
}

/**
 * Compute construction weekly pay with OT.
 * FLSA: OT kicks in at 40hr/wk at 1.5× rate.
 * Per diem is a separate daily amount × days.
 */
export function computeConstructionPay(
  input: ConstructionInput,
): ConstructionBreakdown {
  const totalHours = scheduleToHours(input.schedule, input.custom_hours);
  const straightHours = Math.min(totalHours, 40);
  const otHours = Math.max(0, totalHours - 40);

  const straightPay = round2(input.hourly_rate * straightHours);
  const otPay = round2(input.hourly_rate * 1.5 * otHours);
  const weeklyWage = round2(straightPay + otPay);
  const weeklyPerDiem = round2(input.daily_per_diem * input.per_diem_days);
  const weeklyGrossTotal = round2(weeklyWage + weeklyPerDiem);

  return {
    straight_hours: straightHours,
    ot_hours: otHours,
    straight_pay: straightPay,
    ot_pay: otPay,
    weekly_wage: weeklyWage,
    weekly_per_diem: weeklyPerDiem,
    weekly_gross_total: weeklyGrossTotal,
    total_hours: totalHours,
  };
}

/**
 * For construction, per diem IS the stipend (tax-free portion).
 * When housing_model = "company", only M&IE portion of GSA applies.
 * Standard M&IE is $68/day for most CONUS, up to $92 in NSAs.
 */
export function getGsaComparisonWeekly(
  gsaWeeklyMax: number,
  gsaMealsDaily: number,
  housingModel: HousingModel,
  perDiemDays: number,
): number {
  if (housingModel === "company") {
    // Company pays lodging → only compare against M&IE
    return round2(gsaMealsDaily * perDiemDays);
  }
  // Self-sourced housing → compare against full GSA (lodging + M&IE)
  return gsaWeeklyMax;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
