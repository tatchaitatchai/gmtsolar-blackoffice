import { lazy } from 'react'
import authRoute from './authRoute'
import othersRoute from './othersRoute'
import type { Routes } from '@/@types/routes'

export const publicRoutes: Routes = [...authRoute]

export const protectedRoutes: Routes = [
    {
        key: 'products',
        path: '/products',
        component: lazy(() => import('@/views/products/ProductsPage')),
        authority: [],
    },
    {
        key: 'categories',
        path: '/categories',
        component: lazy(() => import('@/views/categories/CategoriesPage')),
        authority: [],
    },
    {
        key: 'brands',
        path: '/brands',
        component: lazy(() => import('@/views/brands/BrandsPage')),
        authority: [],
    },
    {
        key: 'suppliers',
        path: '/suppliers',
        component: lazy(() => import('@/views/suppliers/SuppliersPage')),
        authority: [],
    },
    {
        key: 'prices',
        path: '/prices',
        component: lazy(() => import('@/views/prices/PricesPage')),
        authority: [],
    },
    {
        key: 'packages',
        path: '/packages',
        component: lazy(() => import('@/views/packages/PackagesPage')),
        authority: [],
    },
    {
        key: 'projects',
        path: '/projects',
        component: lazy(() => import('@/views/projects/ProjectsPage')),
        authority: [],
    },
    ...othersRoute,
]
