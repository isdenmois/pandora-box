import './global.css'
import './button.css'
import './input.css'
import './typography.css'

export * from './confirm'
// Deliberate exception to "no business logic in shared": these three are the shared movie/series
// presentation and know the domain (attribution, poster rules, OMDB refresh). `entities` may not
// import each other, so one copy here beats duplicating them. See AGENTS.md → Client conventions.
export { default as Details } from './details.vue'
export { default as Dialog } from './dialog.vue'
export { default as EditForm } from './edit-form.vue'
export { default as Icon } from './icon.vue'
export * from './icons'
export { default as ImageWithFallback } from './image-with-fallback.vue'
export { default as Item } from './item.vue'
export { default as ItemAdaptive } from './item-adaptive.vue'
export { default as MarkAsViewed, type SeenData } from './mark-as-viewed.vue'
export { default as MoreButton } from './more-button.vue'
export { default as RatingInput } from './rating-input.vue'
export { default as ScheduleToggler } from './schedule-toggler.vue'
export { default as SeasonToggler } from './season-toggler.vue'
export { default as Spinner } from './spinner.vue'
export { default as TagsInput } from './tags-input.vue'
