import {
    PiHouseLineDuotone,
    PiArrowsInDuotone,
    PiBookOpenUserDuotone,
    PiBookBookmarkDuotone,
    PiAcornDuotone,
    PiBagSimpleDuotone,
    PiPackageDuotone,
    PiTagDuotone,
    PiShieldStarDuotone,
    PiStorefrontDuotone,
    PiChartBarDuotone,
    PiCubeDuotone,
    PiHouseSimpleDuotone,
} from 'react-icons/pi'
import type { JSX } from 'react'

export type NavigationIcons = Record<string, JSX.Element>

const navigationIcon: NavigationIcons = {
    home: <PiHouseLineDuotone />,
    singleMenu: <PiAcornDuotone />,
    collapseMenu: <PiArrowsInDuotone />,
    groupSingleMenu: <PiBookOpenUserDuotone />,
    groupCollapseMenu: <PiBookBookmarkDuotone />,
    groupMenu: <PiBagSimpleDuotone />,
    products: <PiPackageDuotone />,
    categories: <PiTagDuotone />,
    brands: <PiShieldStarDuotone />,
    suppliers: <PiStorefrontDuotone />,
    prices: <PiChartBarDuotone />,
    packages: <PiCubeDuotone />,
    projects: <PiHouseSimpleDuotone />,
}

export default navigationIcon
