import { fireEvent, render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import ImageWithFallback from '../image-with-fallback.vue'

describe('ImageWithFallback', () => {
  it('renders the image when a source is given', () => {
    // arrange + act
    render(ImageWithFallback, { props: { src: '/images/movie-1.jpg', alt: 'Some Movie' } })

    // assert
    expect(screen.getByRole('img')).toHaveAttribute('src', '/images/movie-1.jpg')
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Some Movie')
  })

  it('renders a sized placeholder when the source is missing', () => {
    // arrange + act
    const { container } = render(ImageWithFallback, { props: { src: null }, attrs: { class: 'h-20 w-12' } })

    // assert
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    // The placeholder keeps the image classes so the surrounding layout does not shift.
    expect(container.querySelector('.h-20.w-12')).toBeInTheDocument()
  })

  it('swaps to the placeholder when the image fails to load', async () => {
    // arrange
    render(ImageWithFallback, { props: { src: 'https://example.com/broken.jpg', alt: 'Broken' } })

    // act
    await fireEvent.error(screen.getByRole('img'))

    // assert
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('retries when the source changes after a failure', async () => {
    // arrange
    const { rerender } = render(ImageWithFallback, { props: { src: '/images/movie-1.jpg', alt: 'Movie' } })
    await fireEvent.error(screen.getByRole('img'))

    // act
    await rerender({ src: '/images/movie-1.png', alt: 'Movie' })

    // assert
    expect(screen.getByRole('img')).toHaveAttribute('src', '/images/movie-1.png')
  })
})
