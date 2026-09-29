import fc from 'fast-check';
import { NguonCService } from './nguonc.service';

describe('NguonCService additional property tests', () => {
  const service = new NguonCService();

  it('parses categories and extracts year when group contains "Năm"', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-z0-9\-]+$/i.test(s)),
        fc.string({ minLength: 1, maxLength: 50 }),
        (id, slug, name) => {
          const raw = {
            status: 'success',
            movie: {
              id,
              slug,
              name,
              category: { 0: { id: 'c1', slug: '2023', name: '2023', group: 'Năm' } },
            },
          } as any;
          const parsed = service.parseFromJson(raw);
          return parsed.year === '2023';
        },
      ),
      { numRuns: 30 },
    );
  });

  it('is idempotent when upserting same parsed input twice (parse stable)', () => {
    fc.assert(
      fc.property(
        fc.record({ id: fc.string({ minLength: 1 }), slug: fc.string({ minLength: 1 }), name: fc.string({ minLength: 1 }) }),
        (m) => {
          const raw = { status: 'success', movie: { ...m, category: {} } } as any;
          const p1 = service.parseFromJson(raw);
          const p2 = service.parseFromJson(raw);
          return JSON.stringify(p1) === JSON.stringify(p2);
        },
      ),
      { numRuns: 50 },
    );
  });

  it('determineStatus maps common indicators to completed/ongoing', () => {
    const cases: Array<[string, string | null]> = [
      ['Hoàn tất (24/24)', 'completed'],
      ['FULL', 'completed'],
      ['Tập 12', 'ongoing'],
      ['', null],
    ];
    for (const [ce, expectStatus] of cases) {
      const raw = { status: 'success', movie: { id: '1', slug: 's', name: 'n', current_episode: ce } } as any;
      const parsed = service.parseFromJson(raw);
      if (expectStatus === null) {
        expect(parsed.status).toBeNull();
      } else {
        expect(parsed.status).toBe(expectStatus);
      }
    }
  });

  it('handles nullable fields without throwing', () => {
    fc.assert(
      fc.property(
        fc.record({ id: fc.string({ minLength: 1 }), slug: fc.string({ minLength: 1 }), name: fc.string({ minLength: 1 }) }),
        (m) => {
          const raw = {
            status: 'success',
            movie: { ...m, description: null, thumb_url: null, poster_url: null, episodes: null },
          } as any;
          const parsed = service.parseFromJson(raw);
          return parsed.description === null && parsed.thumbUrl === null && parsed.posterUrl === null;
        },
      ),
      { numRuns: 30 },
    );
  });

  it('throws when required fields are missing', () => {
    expect(() => service.parseFromJson({ status: 'success', movie: { slug: 's' } } as any)).toThrow();
    expect(() => service.parseFromJson({ status: 'error', message: 'bad' } as any)).toThrow();
  });
});
