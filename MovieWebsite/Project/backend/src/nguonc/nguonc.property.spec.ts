import fc from 'fast-check';
import { NguonCService } from './nguonc.service';

describe('NguonCService property tests', () => {
  const service = new NguonCService();

  it('parses random minimal valid movies without throwing', () => {
    const movieArb = fc.record({
      id: fc.string({ minLength: 1, maxLength: 10 }),
      slug: fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-z0-9\-]+$/i.test(s)),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      category: fc.dictionary(fc.string({ minLength: 1, maxLength: 3 }), fc.record({ id: fc.string(), slug: fc.string(), name: fc.string(), group: fc.string() })),
      episodes: fc.oneof(
        fc.constant(null),
        fc.record({ items: fc.array(fc.record({ serverName: fc.string(), items: fc.array(fc.record({ name: fc.string(), slug: fc.string(), m3u8: fc.oneof(fc.string(), fc.constant(null)) })) })) })
      ),
    });

    fc.assert(
      fc.property(movieArb, (m) => {
        const raw = { status: 'success', movie: m } as any;
        const parsed = service.parseFromJson(raw);
        // basic invariants
        if (parsed.nguoncId !== String(m.id)) return false;
        if (parsed.slug !== String(m.slug)) return false;
        if (parsed.name !== String(m.name)) return false;
        // episodes length matches when present
        if (m.episodes && m.episodes.items) {
          const expected = m.episodes.items.reduce((acc: number, it: any) => acc + (Array.isArray(it.items) ? it.items.length : 1), 0);
          if (parsed.episodes.length !== expected) return false;
        }
        return true;
      }),
      { numRuns: 50 },
    );
  });
});
