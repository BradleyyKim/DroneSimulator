import React, { useState, createContext } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { Card, Text, Group, Badge } from '@mantine/core';
import { IconGripVertical } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { useResizeObserver } from '@mantine/hooks';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardContextType {
    // We no longer need global size state for S/M/L
    // But we might want to track layout changes if needed
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

interface Props {
    children: React.ReactNode;
}

// Widget Component
export const Widget = React.forwardRef<HTMLDivElement, any>(({ style, className, children, id, ...props }, ref) => {
    // Use Mantine's ResizeObserver hook to get real-time dimensions
    const [resizeRef, rect] = useResizeObserver();

    // Merge refs (RGL needs the ref, and we need it for resize observer)
    // We apply resizeRef to the inner Card or a wrapper div

    return (
        <div ref={ref} style={style} className={className} {...props}>
            <Card
                ref={resizeRef}
                shadow="sm"
                padding="sm"
                radius="md"
                withBorder
                style={{
                    height: '100%',
                    backgroundColor: 'rgba(30, 30, 30, 0.85)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    pointerEvents: 'auto',
                    transition: 'box-shadow 0.2s ease', // Smooth shadow transition
                }}
            >
                <Group justify="space-between" mb="xs" className="drag-handle" style={{ cursor: 'grab' }}>
                    <Group gap={5}>
                        <IconGripVertical size={16} color="gray" />
                        <Text fw={700} size="xs" tt="uppercase" c="dimmed">{props['data-title']}</Text>
                    </Group>
                    <Badge size="xs" variant="outline" color="cyan">WIDGET</Badge>
                </Group>

                <motion.div
                    layout
                    style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Pass dimensions to children */}
                    {React.Children.map(children, child => {
                        if (React.isValidElement(child)) {
                            return React.cloneElement(child, {
                                width: rect.width,
                                height: rect.height
                            } as any);
                        }
                        return child;
                    })}
                </motion.div>
            </Card>
        </div>
    );
});

const Dashboard: React.FC<Props> = ({ children }) => {
    const defaultLayouts = {
        lg: [
            { i: 'control', x: 0, y: 0, w: 3, h: 4, minW: 2, minH: 2 },
            { i: 'telemetry', x: 0, y: 4, w: 3, h: 4, minW: 2, minH: 2 },
            { i: 'video', x: 9, y: 0, w: 3, h: 3, minW: 3, minH: 2 },
        ]
    };

    const [layouts, setLayouts] = useState<any>(defaultLayouts);

    return (
        <DashboardContext.Provider value={{}}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
                <ResponsiveGridLayout
                    className="layout"
                    layouts={layouts}
                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                    cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                    rowHeight={100}
                    draggableHandle=".drag-handle"
                    style={{ pointerEvents: 'none' }}
                    onLayoutChange={(_layout, allLayouts) => setLayouts(allLayouts)}
                    resizeHandles={['se']} // Only bottom-right handle
                >
                    {children}
                </ResponsiveGridLayout>
            </div>
        </DashboardContext.Provider>
    );
};

export default Dashboard;
