import React from 'react';
import { SimpleGrid, Text, Paper, Group, RingProgress, Center, Stack } from '@mantine/core';
import { IconArrowUp, IconGauge, IconBattery, IconWind, IconCompass } from '@tabler/icons-react';
import { motion } from 'framer-motion';

interface Telemetry {
    latitude: number;
    longitude: number;
    altitude: number;
    speed: number;
    battery: number;
    status: string;
    heading: number;
    wind_speed?: number;
}

interface Props {
    telemetry: Telemetry;
    logs: string[];
    width?: number;
    height?: number;
}

const TelemetryPanel: React.FC<Props> = ({ telemetry, logs, width = 400 }) => {
    const isHighWind = (telemetry.wind_speed || 0) > 10.0;
    const batteryColor = telemetry.battery < 20 ? 'red' : telemetry.battery < 50 ? 'yellow' : 'green';

    // Responsive Breakpoint
    const isSmall = width < 320;

    const StatItem = ({ label, value, icon, color = 'cyan' }: any) => (
        <Paper p={isSmall ? 4 : "xs"} radius="md" withBorder bg="rgba(0,0,0,0.3)">
            <Group gap={isSmall ? 4 : "xs"}>
                {icon}
                <div>
                    <Text size={isSmall ? "8px" : "xs"} c="dimmed" tt="uppercase" fw={700}>{label}</Text>
                    <Text fw={700} size={isSmall ? "sm" : "lg"} c={color}>{value}</Text>
                </div>
            </Group>
        </Paper>
    );

    return (
        <Stack gap={isSmall ? 4 : "xs"} style={{ height: '100%' }}>
            <Group grow>
                <Paper p={isSmall ? 4 : "xs"} radius="md" withBorder bg="rgba(0,0,0,0.3)">
                    <Center>
                        <RingProgress
                            size={isSmall ? 50 : 80}
                            thickness={isSmall ? 4 : 8}
                            roundCaps
                            sections={[{ value: telemetry.battery, color: batteryColor }]}
                            label={
                                <Center>
                                    <IconBattery size={isSmall ? 14 : 20} color={batteryColor} />
                                </Center>
                            }
                        />
                    </Center>
                    <Text ta="center" size={isSmall ? "xs" : "sm"} fw={700} mt={isSmall ? -5 : -10}>{telemetry.battery.toFixed(0)}%</Text>
                </Paper>
                <Stack gap={isSmall ? 4 : "xs"}>
                    <StatItem
                        label="Altitude"
                        value={`${telemetry.altitude.toFixed(1)} m`}
                        icon={<IconArrowUp size={isSmall ? 14 : 20} color="cyan" />}
                    />
                    <StatItem
                        label="Speed"
                        value={`${telemetry.speed.toFixed(1)} m/s`}
                        icon={<IconGauge size={isSmall ? 14 : 20} color="orange" />}
                    />
                </Stack>
            </Group>

            <SimpleGrid cols={2} spacing={isSmall ? 4 : "xs"}>
                <StatItem
                    label="Wind"
                    value={`${(telemetry.wind_speed || 0).toFixed(1)} m/s`}
                    icon={<IconWind size={isSmall ? 14 : 20} color={isHighWind ? 'red' : 'white'} />}
                    color={isHighWind ? 'red' : 'white'}
                />
                <StatItem
                    label="Heading"
                    value={`${telemetry.heading.toFixed(0)}°`}
                    icon={<IconCompass size={isSmall ? 14 : 20} color="gray" />}
                    color="white"
                />
            </SimpleGrid>

            {!isSmall && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Paper p="xs" radius="md" withBorder bg={telemetry.status === 'DISCONNECTED' ? 'red.9' : 'blue.9'}>
                        <Group justify="space-between">
                            <Text size="xs" fw={700} c="white">STATUS</Text>
                            <Text fw={900} c="white" tt="uppercase">{telemetry.status}</Text>
                        </Group>
                    </Paper>
                </motion.div>
            )}

            {/* Terminal Log - Hide on Small */}
            {!isSmall && (
                <motion.div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Paper p="xs" radius="md" withBorder bg="rgba(0,0,0,0.5)" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <Text size="xs" c="dimmed" mb={5} fw={700}>SYSTEM LOGS</Text>
                        <div style={{ flex: 1, overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {logs.map((log, i) => (
                                <div key={i} style={{ color: '#0f0', marginBottom: '2px' }}>{log}</div>
                            ))}
                        </div>
                    </Paper>
                </motion.div>
            )}
        </Stack>
    );
};

export default TelemetryPanel;
