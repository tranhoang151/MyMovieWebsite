import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import fc from 'fast-check';
import MovieCard from './MovieCard';
import { Movie } from '@/types';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('MovieCard (Property 25)', () => {
  it('should render movie name and image for any valid movie data', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          slug: fc.string({ minLength: 1, maxLength: 50 }),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          thumbUrl: fc.webUrl(),
          posterUrl: fc.webUrl(),
          year: fc.option(fc.integer({ min: 1900, max: 2100 }).map(String)),
          quality: fc.option(fc.constantFrom('HD', 'FHD', 'CAM')),
          language: fc.option(fc.constantFrom('Vietsub', 'Thuyết Minh', 'Lồng Tiếng')),
        }),
        (movieData) => {
          const movie: Movie = {
            ...movieData,
            nguoncId: movieData.id,
            totalEpisodes: 1,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          render(<MovieCard movie={movie} />);

          // Verify movie name is rendered
          expect(screen.getByText(movie.name)).toBeInTheDocument();

          // Verify image is rendered with correct alt text
          const img = screen.getByAltText(movie.name);
          expect(img).toBeInTheDocument();
          expect(img).toHaveAttribute('src', movie.thumbUrl || movie.posterUrl);
        }
      ),
      { numRuns: 50 }
    );
  });
});