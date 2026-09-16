import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import TagsInput from '../tags-input.vue'

const user = userEvent.setup()

const getTagButtons = () => screen.getAllByRole('button').filter((button) => button.textContent !== '+')

describe('tags-input', () => {
  it('renders a sorted deduplicated union of prop tags and model value', () => {
    // arrange
    // act
    render(TagsInput, { props: { tags: ['sci-fi', 'drama'], modelValue: ['drama', 'classic'] } })

    // assert
    const names = getTagButtons().map((button) => button.textContent)

    expect(names).toEqual(['classic', 'drama', 'sci-fi'])
  })

  it('marks tags from model value as selected', () => {
    // arrange
    // act
    render(TagsInput, { props: { tags: ['a', 'b'], modelValue: ['a'] } })

    // assert
    expect(screen.getByRole('button', { name: 'a' })).toHaveClass('primary')
    expect(screen.getByRole('button', { name: 'b' })).toHaveClass('secondary')
  })

  it('emits model value with the tag appended when an unselected tag is clicked', async () => {
    // arrange
    const onUpdate = vi.fn()
    render(TagsInput, { props: { tags: ['a', 'b'], modelValue: ['a'], 'onUpdate:modelValue': onUpdate } })

    // act
    await user.click(screen.getByRole('button', { name: 'b' }))

    // assert
    expect(onUpdate).toHaveBeenCalledExactlyOnceWith(['a', 'b'])
  })

  it('emits model value with the tag removed when a selected tag is clicked', async () => {
    // arrange
    const onUpdate = vi.fn()
    render(TagsInput, { props: { tags: ['a', 'b'], modelValue: ['a', 'b'], 'onUpdate:modelValue': onUpdate } })

    // act
    await user.click(screen.getByRole('button', { name: 'a' }))

    // assert
    expect(onUpdate).toHaveBeenCalledExactlyOnceWith(['b'])
  })

  it('adds a trimmed new tag on submit and clears the input', async () => {
    // arrange
    const onUpdate = vi.fn()
    render(TagsInput, { props: { tags: [], modelValue: ['a'], 'onUpdate:modelValue': onUpdate } })
    const input = screen.getByPlaceholderText('Add new tag')

    // act
    await user.type(input, '  new tag  ')
    await user.click(screen.getByRole('button', { name: '+' }))

    // assert
    expect(onUpdate).toHaveBeenCalledExactlyOnceWith(['a', 'new tag'])
    expect(input).toHaveValue('')
  })

  it('does not emit when the new tag is empty or whitespace', async () => {
    // arrange
    const onUpdate = vi.fn()
    render(TagsInput, { props: { tags: [], modelValue: ['a'], 'onUpdate:modelValue': onUpdate } })
    const input = screen.getByPlaceholderText('Add new tag')

    // act
    await user.type(input, '   ')
    await user.click(screen.getByRole('button', { name: '+' }))

    // assert
    expect(onUpdate).not.toHaveBeenCalled()
  })
})
