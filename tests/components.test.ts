import { beforeEach, describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BudgetProgress from '../components/budgets/BudgetProgress.vue'
import Pagination from '../components/ui/Pagination.vue'
import { computed } from 'vue'
beforeEach(() => {
  vi.stubGlobal('useAuthStore', () => ({ profile: { currency: 'USD' } }))
  vi.stubGlobal('computed', computed)
})
describe('budget progress', () => {
  it('exposes the actual over-budget percentage to assistive technology', () => {
    const wrapper = mount(BudgetProgress, {
      props: { name: 'Dining', amount: 100, spent: 125 },
      global: { stubs: { UiAppIcon: true } },
    })
    expect(
      wrapper.get('[role="progressbar"]').attributes('aria-valuenow'),
    ).toBe('100')
    expect(
      wrapper.get('[role="progressbar"]').attributes('aria-valuetext'),
    ).toBe('125% used')
    expect(wrapper.text()).toContain('$25.00 over')
  })
})
describe('pagination', () => {
  it('disables previous on first page and emits the next page', async () => {
    const wrapper = mount(Pagination, {
      props: { page: 1, count: 25, pageSize: 10 },
      global: { stubs: { UiAppIcon: true } },
    })
    expect(
      wrapper.get('[aria-label="Previous page"]').attributes('disabled'),
    ).toBeDefined()
    await wrapper.get('[aria-label="Next page"]').trigger('click')
    expect(wrapper.emitted('change')).toEqual([[2]])
  })
  it('disables next on the final partial page', () => {
    const wrapper = mount(Pagination, {
      props: { page: 3, count: 25, pageSize: 10 },
      global: { stubs: { UiAppIcon: true } },
    })
    expect(wrapper.text()).toContain('21–25')
    expect(
      wrapper.get('[aria-label="Next page"]').attributes('disabled'),
    ).toBeDefined()
  })
})
