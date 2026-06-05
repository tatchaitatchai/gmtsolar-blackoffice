import type { ForwardRefExoticComponent, RefAttributes } from 'react'
import _Checkbox from './Checkbox'
import type { CheckboxProps } from './Checkbox'
import CheckboxGroup from './Group'

export type { CheckboxProps } from './Checkbox'
export type { CheckboxGroupProps } from './Group'
export type { CheckboxGroupValue, CheckboxValue } from './context'

type CompoundedComponent = ForwardRefExoticComponent<
    CheckboxProps & RefAttributes<HTMLInputElement>
> & {
    Group: typeof CheckboxGroup
}

const Checkbox = _Checkbox as CompoundedComponent

Checkbox.Group = CheckboxGroup

export { Checkbox }

export default Checkbox
