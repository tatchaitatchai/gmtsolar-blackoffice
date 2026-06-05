import { cloneElement } from 'react'
import type { CommonProps } from '@/@types/common'

type SideProps = CommonProps

const Side = ({ children, ...rest }: SideProps) => {
    return (
        <div className="flex h-full p-6 bg-white dark:bg-gray-800">
            <div className=" flex flex-col justify-center items-center flex-1">
                <div className="w-full xl:max-w-[450px] px-8 max-w-[380px]">
                    {children
                        ? cloneElement(children as React.ReactElement, {
                              ...rest,
                          })
                        : null}
                </div>
            </div>
            <div className="py-6 px-10 lg:flex flex-col flex-1 justify-between hidden rounded-3xl items-center justify-center relative xl:max-w-[520px] 2xl:max-w-[720px] overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 40%, #d97706 100%)' }}>
                <div className="absolute inset-0 opacity-10">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="70%" cy="30%" r="180" fill="white"/>
                        <circle cx="20%" cy="80%" r="120" fill="white"/>
                    </svg>
                </div>
                <div className="relative z-10 flex flex-col items-center text-white text-center px-8">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" className="w-32 h-32 mb-8 drop-shadow-lg">
                        <circle cx="60" cy="60" r="24" fill="white" fillOpacity="0.95"/>
                        <line x1="60" y1="8" x2="60" y2="26" stroke="white" strokeWidth="6" strokeLinecap="round"/>
                        <line x1="60" y1="94" x2="60" y2="112" stroke="white" strokeWidth="6" strokeLinecap="round"/>
                        <line x1="8" y1="60" x2="26" y2="60" stroke="white" strokeWidth="6" strokeLinecap="round"/>
                        <line x1="94" y1="60" x2="112" y2="60" stroke="white" strokeWidth="6" strokeLinecap="round"/>
                        <line x1="23" y1="23" x2="36" y2="36" stroke="white" strokeWidth="6" strokeLinecap="round"/>
                        <line x1="84" y1="84" x2="97" y2="97" stroke="white" strokeWidth="6" strokeLinecap="round"/>
                        <line x1="97" y1="23" x2="84" y2="36" stroke="white" strokeWidth="6" strokeLinecap="round"/>
                        <line x1="36" y1="84" x2="23" y2="97" stroke="white" strokeWidth="6" strokeLinecap="round"/>
                    </svg>
                    <h2 className="text-3xl font-bold mb-3 drop-shadow">GMT Solar</h2>
                    <p className="text-lg font-medium opacity-90">ระบบจัดการหลังบ้าน</p>
                    <p className="text-sm opacity-75 mt-2">Solar Installation Management</p>
                </div>
            </div>
        </div>
    )
}

export default Side
