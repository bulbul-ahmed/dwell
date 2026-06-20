const MAP: Record<string, [string, string]> = {
  Active:    ['#2E7D55', '#E7F1EC'],
  Live:      ['#2E7D55', '#E7F1EC'],
  Confirmed: ['#2E7D55', '#E7F1EC'],
  New:       ['#2E7D55', '#E7F1EC'],
  Pending:   ['#9A6A1F', '#F7EFDD'],
  Requested: ['#9A6A1F', '#F7EFDD'],
  Suggested: ['#2A5C8A', '#E6EFF7'],
  Rented:    ['#2A5C8A', '#E6EFF7'],
  Paused:    ['#5A6172', '#EEF0F3'],
  Completed: ['#5A6172', '#EEF0F3'],
  Replied:   ['#5A6172', '#EEF0F3'],
  Declined:  ['#B4402B', '#F8E8E3'],
};

export function badge(status: string) {
  const c = MAP[status] ?? ['#5A6172', '#EEF0F3'];
  return { fg: c[0], bg: c[1] };
}
