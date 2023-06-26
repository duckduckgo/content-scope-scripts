import { findClosestBreakpoint } from '../src/features/runtime-checks/helpers.js'

describe('Runtime checks', () => {
    describe('findClosestBreakpoint', () => {
        it('no breakpoints returns null', () => {
            const closest = findClosestBreakpoint([], { height: 1, width: 1 })
            expect(closest).toBeNull()
        })

        it('picks closest when exact match', () => {
            const closest = findClosestBreakpoint([
                { height: 1, width: 1 },
                { height: 1024, width: 768 }
            ], { height: 1024, width: 768 })
            expect(closest).toEqual({ height: 1024, width: 768 })
        })

        it('picks closest when close matches', () => {
            const closest = findClosestBreakpoint([
                { height: 1, width: 1 },
                { height: 1000, width: 700 }
            ], { height: 1024, width: 768 })
            expect(closest).toEqual({ height: 1000, width: 700 })

            const closest2 = findClosestBreakpoint([
                { height: 1, width: 1 },
                { height: 1000, width: 700 },
                { height: 2000, width: 800 }
            ], { height: 1024, width: 768 })
            expect(closest2).toEqual({ height: 1000, width: 700 })

            // Picks the first one if there's a tie
            const closest3 = findClosestBreakpoint([
                { height: 1, width: 1 },
                { height: 1023, width: 768 },
                { height: 1025, width: 768 }
            ], { height: 1024, width: 768 })
            expect(closest3).toEqual({ height: 1023, width: 768 })

            const closest4 = findClosestBreakpoint([
                { height: 1, width: 1 },
                { height: 1023, width: 767 },
                { height: 1023, width: 769 },
                { height: 1025, width: 767 },
                { height: 1025, width: 769 }
            ], { height: 1024, width: 768 })
            expect(closest4).toEqual({ height: 1023, width: 767 })
        })

        it('picks closest when clear match', () => {
            const breakpoints = [
                { height: 500, width: 600 },
                { height: 1024, width: 768 },
                { height: 2000, width: 1000 },
                { height: 20000, width: 8000 }
            ]
            const closest = findClosestBreakpoint(breakpoints, { height: 1024, width: 768 })
            expect(closest).toEqual({ height: 1024, width: 768 })

            const closest2 = findClosestBreakpoint(breakpoints, { height: 800, width: 600 })
            expect(closest2).toEqual({ height: 1024, width: 768 })

            const closest3 = findClosestBreakpoint(breakpoints, { height: 550, width: 600 })
            expect(closest3).toEqual({ height: 500, width: 600 })
        })
    })
})
