import 'server-only'
import type { Rec } from './records'
import { rm, todayISO } from './records'

// 🔒 Don't edit — this keeps your robot safe.
// The Jarvis bot's HANDS. Instead of dumping your whole table into the prompt,
// Claude picks ONE of these small tools, the server runs it against your records,
// and the result comes back grounded. This IS the foundational agent loop:
//   Claude decides → the server runs the tool → Claude reads the result → answers.
// Cheaper (no full-table dumps), and money answers are always grounded in a real
// query, never guessed.
//
// Every tool here is READ-ONLY. None of them writes a row, sends a message, or
// moves money — Jarvis answers questions; it never acts. (Acting is the HITL
// engine's job, behind an approval.)

// The tool schema handed to Claude. `escalate` is the human escape hatch: Claude
// calls it (instead of guessing) when the user is stuck, frustrated, or asks for
// something outside these read tools.
export const BOT_TOOLS = [
  {
    name: 'get_cash_summary',
    description:
      'Get cash in, cash out, net, and how much is still owed to the owner, for a time window. ' +
      'Use this for ANY money total question ("how much cash in this week?", "what\'s my net this month?", "who owes me?").',
    input_schema: {
      type: 'object' as const,
      properties: {
        period: {
          type: 'string',
          enum: ['week', 'month', 'all'],
          description: 'week = last 7 days, month = last 30 days, all = everything. Default all.',
        },
      },
    },
  },
  {
    name: 'list_overdue',
    description:
      'List everything past its due date and not yet done/paid — overdue invoices, tasks, follow-ups.',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'search_records',
    description:
      'Find records whose title, notes, or details match a search word. Optionally filter to one ' +
      'category (cash_in, cash_out, lead, customer, content, task, doc).',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'The word or name to look for.' },
        category: {
          type: 'string',
          enum: ['cash_in', 'cash_out', 'lead', 'customer', 'content', 'task', 'doc'],
          description: 'Optional — restrict the search to one category.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'escalate',
    description:
      'Flag the human owner and stop. Use this — instead of guessing — when the user is frustrated, ' +
      'asks to talk to a human, wants something these read tools cannot do, or you have already tried ' +
      'twice and failed. Never invent an answer for a money question you cannot ground in a tool result.',
    input_schema: {
      type: 'object' as const,
      properties: { reason: { type: 'string', description: 'One short line on why you are escalating.' } },
      required: ['reason'],
    },
  },
]

const sum = (rows: Rec[]) => rows.reduce((s, r) => s + Number(r.amount || 0), 0)
const PAID = new Set(['paid', 'done', 'closed', 'reversed'])

// ------------------------------------------------------------
// runBotTool() — execute ONE tool against the already-fetched records. Returns a
// compact JSON string (the caller wraps it in <<<DATA…DATA>>> as untrusted data).
// `escalate` returns a sentinel the loop watches for. Never throws.
// ------------------------------------------------------------
export function runBotTool(name: string, input: any, rows: Rec[]): string {
  try {
    if (name === 'escalate') {
      return JSON.stringify({ escalated: true, reason: String(input?.reason || 'flagged') })
    }

    if (name === 'get_cash_summary') {
      const period: 'week' | 'month' | 'all' =
        input?.period === 'week' || input?.period === 'month' ? input.period : 'all'
      const days = period === 'week' ? 7 : period === 'month' ? 30 : Infinity
      const since = Date.now() - days * 86_400_000
      const inWindow = (r: Rec) =>
        !Number.isFinite(days) || new Date(r.created_at).getTime() >= since

      const cashIn = sum(rows.filter(r => r.category === 'cash_in' && inWindow(r)))
      const cashOut = sum(rows.filter(r => r.category === 'cash_out' && inWindow(r)))
      // "Who owes me" = cash_in still unpaid — outstanding regardless of the window.
      const owed = sum(rows.filter(r => r.category === 'cash_in' && !PAID.has((r.status || '').toLowerCase())))
      return JSON.stringify({
        period,
        cash_in: cashIn,
        cash_out: cashOut,
        net: cashIn - cashOut,
        owed_to_you: owed,
        display: {
          cash_in: rm(cashIn),
          cash_out: rm(cashOut),
          net: rm(cashIn - cashOut),
          owed_to_you: rm(owed),
        },
      })
    }

    if (name === 'list_overdue') {
      const today = todayISO()
      const overdue = rows
        .filter(r => r.due_date && r.due_date < today && !PAID.has((r.status || '').toLowerCase()))
        .map(r => ({
          title: r.title,
          category: r.category,
          amount: r.amount,
          due_date: r.due_date,
          status: r.status,
        }))
      return JSON.stringify({ count: overdue.length, overdue })
    }

    if (name === 'search_records') {
      const q = String(input?.query || '').toLowerCase().trim()
      const cat = input?.category
      const hits = rows
        .filter(r => (cat ? r.category === cat : true))
        .filter(r => {
          if (!q) return true
          const hay = `${r.title} ${r.notes || ''} ${JSON.stringify(r.meta || {})}`.toLowerCase()
          return hay.includes(q)
        })
        .slice(0, 25)
        .map(r => ({
          title: r.title,
          category: r.category,
          status: r.status,
          amount: r.amount,
          due_date: r.due_date,
          ...r.meta,
        }))
      return JSON.stringify({ count: hits.length, results: hits })
    }

    return JSON.stringify({ error: `unknown tool "${name}"` })
  } catch (e: any) {
    // A tool must never crash the bot — degrade to a calm, grounded "couldn't run".
    console.error('[CFO] bot tool failed:', e)
    return JSON.stringify({ error: 'that lookup failed — try rephrasing' })
  }
}
