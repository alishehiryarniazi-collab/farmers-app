export type Role = "FARMER" | "BUYER" | "ADMIN";

export function toRole(value: string): Role {
  if (value !== "FARMER" && value !== "BUYER" && value !== "ADMIN") {
    throw new Error(`Invalid role in database: ${value}`);
  }
  return value;
}
