import userEvent from '@testing-library/user-event'
import { fireEvent, render, screen } from '@testing-library/vue'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import ScheduleToggler from '../schedule-toggler.vue'

const user = userEvent.setup()

describe('schedule-toggler', () => {
  beforeAll(() => {
    // jsdom does not implement showPicker, the directive calls it on the date input
    HTMLInputElement.prototype.showPicker = vi.fn()
  })

  it('renders without a date input and with No active when nothing is scheduled', () => {
    // arrange
    // act
    render(ScheduleToggler, { props: { modelValue: null } })

    // assert
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByDisplayValue(/.+/)).not.toBeInTheDocument()
    expect(screen.getByText('No')).toHaveClass('active')
  })

  it('emits -1 when Yes is clicked', async () => {
    // arrange
    const onUpdate = vi.fn()
    render(ScheduleToggler, { props: { modelValue: null, 'onUpdate:modelValue': onUpdate } })

    // act
    await user.click(screen.getByText('Yes'))

    // assert
    expect(onUpdate).toHaveBeenCalledExactlyOnceWith(-1)
  })

  it('emits null when No is clicked', async () => {
    // arrange
    const onUpdate = vi.fn()
    render(ScheduleToggler, { props: { modelValue: -1, 'onUpdate:modelValue': onUpdate } })

    // act
    await user.click(screen.getByText('No'))

    // assert
    expect(onUpdate).toHaveBeenCalledExactlyOnceWith(null)
  })

  it('emits the current timestamp and shows the date input when Date is clicked', async () => {
    // arrange
    const onUpdate = vi.fn()
    const { container } = render(ScheduleToggler, { props: { 'onUpdate:modelValue': onUpdate } })
    const before = Date.now()

    // act
    await user.click(screen.getByText('Date'))

    // assert
    const [value] = onUpdate.mock.calls[0]
    expect(value).toBeGreaterThanOrEqual(before)
    expect(value).toBeLessThanOrEqual(Date.now())
    expect(container.querySelector('input[type="date"]')).toBeInTheDocument()
    expect(HTMLInputElement.prototype.showPicker).toHaveBeenCalled()
  })

  it('renders Yes as active when the schedule is -1', () => {
    // arrange
    // act
    render(ScheduleToggler, { props: { modelValue: -1 } })

    // assert
    expect(screen.getByText('Yes')).toHaveClass('active')
  })

  it('does not emit when Date is clicked while a date is already set', async () => {
    // arrange
    const onUpdate = vi.fn()
    render(ScheduleToggler, {
      props: { modelValue: new Date('2026-02-03T12:00:00').getTime(), 'onUpdate:modelValue': onUpdate },
    })

    // act
    await user.click(screen.getByText('Date'))

    // assert
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('renders the date input with the scheduled date', () => {
    // arrange
    // act
    render(ScheduleToggler, { props: { modelValue: new Date('2026-02-03T12:00:00').getTime() } })

    // assert
    expect(screen.getByDisplayValue('2026-02-03')).toBeInTheDocument()
  })

  it('emits the picked timestamp when the date input changes', async () => {
    // arrange
    const onUpdate = vi.fn()
    render(ScheduleToggler, {
      props: {
        modelValue: new Date('2026-02-03T12:00:00').getTime(),
        'onUpdate:modelValue': onUpdate,
      },
    })
    const input = screen.getByDisplayValue('2026-02-03')

    // act
    input.value = '2026-03-05'
    await fireEvent(input, new Event('change'))

    // assert
    expect(onUpdate).toHaveBeenCalledExactlyOnceWith(new Date('2026-03-05').getTime())
  })
})
