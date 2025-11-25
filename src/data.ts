import { readFile, writeFile } from "node:fs/promises";
import { createId } from "@paralleldrive/cuid2";

export type Inventory = {
  id: string;
  switchName: string;
  interface: string;
  vlanId: number;
  speedMbps: number;
  status: string;
  description: string;
};

export type InventoryBase = Omit<Inventory, "id">;

export function extendWithIds(input: InventoryBase[]): Inventory[] {
  const output: Inventory[] = input.map((i) => {
    return {
      id: createId(),
      ...i,
    };
  });

  return output;
}

export async function readCsv(filename: string): Promise<InventoryBase[]> {
  const lines = await readFile(filename, { encoding: "utf8" });

  const inventory: InventoryBase[] = [];

  const data = lines
    .split("\n")
    .slice(1)
    .map((l) => l.trim());

  for (let line of data) {
    const s = line.split(",");

    inventory.push({
      switchName: s[0] ?? "",
      interface: s[1] ?? "",
      vlanId: Number.parseInt(s[2] ?? "0"),
      speedMbps: Number.parseInt(s[3] ?? "0"),
      status: s[4] ?? "",
      description: s[5] ?? "",
    });
  }

  return inventory;
}

export async function saveJson(filename: string, content: Inventory[]) {
  const output = JSON.stringify(content);
  await writeFile(filename, output);
}

export async function readJson(filename: string): Promise<Inventory[]> {
  const file = await readFile(filename, { encoding: "utf8" });
  return JSON.parse(file);
}
