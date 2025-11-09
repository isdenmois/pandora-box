export const vShowPickerOnMount = {
  mounted: (el: HTMLInputElement, { value }: { value: boolean }) => value && el.showPicker(),
}
