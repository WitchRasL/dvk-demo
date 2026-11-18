// Разбор robots.txt: группы User-agent, Allow/Disallow с `*` и `$`.
// Побеждает самое длинное совпавшее правило; при равной длине — Allow (как у Google и Яндекса).

/**
 * @param {string} text содержимое robots.txt
 * @param {string} [agent='*'] имя нашего робота; берём его группу, иначе группу `*`
 * @returns {{ allow: boolean, pattern: string }[]}
 */
export function parseRobots(text, agent = '*') {
  const groups = [];
  let current = null;
  let lastWasAgent = false;

  for (const rawLine of String(text ?? '').split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, '').trim();
    if (!line) continue;
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();

    if (key === 'user-agent') {
      if (!lastWasAgent || !current) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!current) continue;
    if (key === 'allow' || key === 'disallow') {
      // Пустой Disallow означает «можно всё» — правила не добавляет.
      if (value) current.rules.push({ allow: key === 'allow', pattern: value });
    }
  }

  const wanted = agent.toLowerCase();
  const own = groups.filter((group) => wanted !== '*' && group.agents.some((name) => name !== '*' && wanted.includes(name)));
  const chosen = own.length ? own : groups.filter((group) => group.agents.includes('*'));
  return chosen.flatMap((group) => group.rules);
}

function patternToRegExp(pattern) {
  const anchored = pattern.endsWith('$');
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const source = body
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp(`^${source}${anchored ? '$' : ''}`);
}

/**
 * @param {{ allow: boolean, pattern: string }[]} rules результат parseRobots
 * @param {string} url полный адрес или путь с query
 */
export function isAllowed(rules, url) {
  let path;
  try {
    const parsed = new URL(url, 'https://example.invalid');
    path = parsed.pathname + parsed.search;
  } catch {
    path = String(url);
  }

  let best = null;
  for (const rule of rules) {
    if (!patternToRegExp(rule.pattern).test(path)) continue;
    const length = rule.pattern.length;
    if (!best || length > best.length || (length === best.length && rule.allow)) {
      best = { length, allow: rule.allow };
    }
  }
  return best ? best.allow : true;
}
