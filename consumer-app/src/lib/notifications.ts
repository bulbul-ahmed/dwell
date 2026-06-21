import { db, notifications } from '@/db';
import { and, eq, sql } from 'drizzle-orm';
import { notifyUser } from '@/lib/notify-user';

type NotifType = 'visit' | 'message' | 'listing' | 'review' | 'system';

interface CreateNotifOpts {
  userId: number;
  type: NotifType;
  title: string;
  body: string;
  href: string;
  threadId?: number;
  senderName?: string;
}

const TYPE_META: Record<NotifType, { icon: string; icoBg: string; icoFg: string }> = {
  visit:   { icon: 'ti-calendar',   icoBg: '#EEF3F8', icoFg: '#1E3A5C' },
  message: { icon: 'ti-message-2',  icoBg: '#EEF3F8', icoFg: '#1E3A5C' },
  listing: { icon: 'ti-home',       icoBg: '#F2F4F7', icoFg: '#41495A' },
  review:  { icon: 'ti-star',       icoBg: '#FFF8ED', icoFg: '#B8660A' },
  system:  { icon: 'ti-bell',       icoBg: '#F2F4F7', icoFg: '#41495A' },
};

export async function createNotification(opts: CreateNotifOpts) {
  const meta = TYPE_META[opts.type];

  if (opts.type === 'message' && opts.threadId) {
    const [existing] = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, opts.userId),
        eq(notifications.type, 'message'),
        eq(notifications.threadId, opts.threadId),
        eq(notifications.read, false),
      ))
      .limit(1);

    if (existing) {
      const newCount = (existing.count ?? 1) + 1;
      const title = opts.senderName
        ? `${opts.senderName} · ${newCount} new messages`
        : `${newCount} new messages`;
      const [updated] = await db
        .update(notifications)
        .set({
          title,
          body: opts.body,
          href: opts.href,
          count: newCount,
          updatedAt: new Date(),
          createdAt: new Date(),
        })
        .where(eq(notifications.id, existing.id))
        .returning();
      await notifyUser(opts.userId, { kind: 'notification', notification: updated });
      return [updated];
    }
  }

  const inserted = await db.insert(notifications).values({
    userId:   opts.userId,
    type:     opts.type,
    title:    opts.title,
    body:     opts.body,
    href:     opts.href,
    icon:     meta.icon,
    icoBg:    meta.icoBg,
    icoFg:    meta.icoFg,
    read:     false,
    threadId: opts.threadId ?? null,
    count:    1,
  }).returning();

  await notifyUser(opts.userId, { kind: 'notification', notification: inserted[0] });
  return inserted;
}

export async function pruneOldRead(userId: number, days = 30) {
  await db.execute(sql`
    DELETE FROM notifications
    WHERE user_id = ${userId}
      AND read = true
      AND created_at < now() - (${days}::int * interval '1 day')
  `);
}
