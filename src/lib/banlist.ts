import { BanList } from "@/models/BanList";

export async function isBanned(
  ip?: string,
  deviceFingerprint?: string
): Promise<{ banned: boolean; reason?: string; type?: string } > {
  const values: { type: string; value: string }[] = [];
  if (ip && ip !== "unknown") values.push({ type: "ip", value: ip });
  if (deviceFingerprint) values.push({ type: "device", value: deviceFingerprint });
  if (values.length === 0) return { banned: false };

  const entry = await BanList.findOne({
    active: true,
    $or: values,
    $and: [
      {
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      },
    ],
  }).lean();

  if (!entry) return { banned: false };
  return { banned: true, reason: entry.reason, type: entry.type };
}

export async function addBan(opts: {
  type: "ip" | "device" | "email" | "phone";
  value: string;
  userId?: string;
  reason?: string;
  bannedBy?: string;
  expiresAt?: Date;
}) {
  return BanList.findOneAndUpdate(
    { type: opts.type, value: opts.value },
    {
      type: opts.type,
      value: opts.value,
      userId: opts.userId,
      reason: opts.reason,
      bannedBy: opts.bannedBy,
      active: true,
      expiresAt: opts.expiresAt,
    },
    { upsert: true, new: true }
  );
}

export async function removeBan(opts: {
  type: "ip" | "device" | "email" | "phone";
  value: string;
}) {
  return BanList.updateMany(
    { type: opts.type, value: opts.value },
    { $set: { active: false } }
  );
}
