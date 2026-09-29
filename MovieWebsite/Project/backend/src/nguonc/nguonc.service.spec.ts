import { NguonCService } from './nguonc.service';

describe('NguonCService', () => {
  let service: NguonCService;

  beforeEach(() => {
    service = new NguonCService();
  });

  it('parses minimal valid movie', () => {
    const raw = {
      status: 'success',
      movie: {
        id: '123',
        slug: 'test-movie',
        name: 'Test Movie',
        category: {
          0: { id: '1', slug: 'action', name: 'Action', group: 'Thể loại' },
          1: { id: '2', slug: '2023', name: '2023', group: 'Năm' },
        },
        episodes: { items: [{ serverName: 'S1', items: [{ name: 'T1', slug: 'ep1', m3u8: 'u' }] }] },
      },
    } as any;

    const parsed = service.parseFromJson(raw);
    expect(parsed.nguoncId).toBe('123');
    expect(parsed.slug).toBe('test-movie');
    expect(parsed.year).toBe('2023');
    expect(parsed.episodes.length).toBe(1);
    expect(parsed.categories.length).toBe(2);
  });

  it('throws on error responses', () => {
    expect(() => service.parseFromJson({ status: 'error', message: 'not found' } as any)).toThrow();
  });
});
