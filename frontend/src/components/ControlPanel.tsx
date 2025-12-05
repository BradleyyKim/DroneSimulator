import React from 'react';
import { Button, Group, Stack } from '@mantine/core';
import { IconPlaneDeparture, IconHome, IconPlayerPlay, IconAlertTriangle, IconArrowDown } from '@tabler/icons-react';

import { motion } from 'framer-motion';

interface Props {
    sendCommand: (type: string, param1?: number, param2?: number, param3?: number) => void;
    width?: number;
    height?: number;
}

const ControlPanel: React.FC<Props> = ({ sendCommand, width = 400 }) => {
    const isSmall = width < 320;

    return (
        <Stack gap={isSmall ? 4 : "xs"} style={{ height: '100%' }}>
            <Group grow>
                <Button
                    leftSection={<IconPlaneDeparture size={isSmall ? 14 : 16} />}
                    variant="default"
                    color="blue"
                    size={isSmall ? "xs" : "sm"}
                    onClick={() => sendCommand('ARM')}
                    style={{ padding: isSmall ? '0 5px' : undefined }}
                >
                    {isSmall ? 'ARM' : 'ARM'}
                </Button>
                <Button
                    leftSection={<IconArrowDown size={isSmall ? 14 : 16} />}
                    variant="default"
                    color="orange"
                    size={isSmall ? "xs" : "sm"}
                    onClick={() => sendCommand('TAKEOFF', 10)}
                    style={{ padding: isSmall ? '0 5px' : undefined }}
                >
                    {isSmall ? 'FLY' : 'TAKEOFF'}
                </Button>
            </Group>

            <Button
                fullWidth
                leftSection={<IconPlayerPlay size={isSmall ? 14 : 16} />}
                variant="outline"
                color="green"
                size={isSmall ? "xs" : "sm"}
                onClick={() => sendCommand('START_MISSION')}
            >
                {isSmall ? 'INSPECT' : 'START INSPECTION'}
            </Button>

            <Group grow>
                <Button
                    leftSection={<IconHome size={isSmall ? 14 : 16} />}
                    variant="default"
                    size={isSmall ? "xs" : "sm"}
                    onClick={() => sendCommand('RETURN_TO_HOME')}
                    style={{ padding: isSmall ? '0 5px' : undefined }}
                >
                    RTH
                </Button>
                <Button
                    leftSection={<IconArrowDown size={isSmall ? 14 : 16} />}
                    variant="default"
                    color="gray"
                    size={isSmall ? "xs" : "sm"}
                    onClick={() => sendCommand('LAND')}
                    style={{ padding: isSmall ? '0 5px' : undefined }}
                >
                    LAND
                </Button>
            </Group>

            {!isSmall && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Button
                        fullWidth
                        leftSection={<IconAlertTriangle size={16} />}
                        color="red"
                        variant="outline"
                        className="flash-button"
                        onClick={() => sendCommand('RETURN_TO_HOME')}
                        style={{ borderColor: '#ff4444', color: '#ff4444' }}
                    >
                        SIMULATE JAMMING
                    </Button>
                </motion.div>
            )}
        </Stack>
    );
};

export default ControlPanel;
