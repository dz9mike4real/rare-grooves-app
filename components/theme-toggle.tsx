'use client';

import { useMantineColorScheme, useComputedColorScheme, ActionIcon, Button } from '@mantine/core';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { toggleColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <ActionIcon
        variant="subtle"
        size="xl"
        radius="xl"
        className="h-11 w-11 relative hover:bg-secondary"
      >
        <span className="sr-only">Toggle theme</span>
      </ActionIcon>
    )
  }

  return (
    <ActionIcon
      variant="subtle"
      size="xl"
      radius="xl"
      onClick={() => toggleColorScheme()}
      className="h-11 w-11 relative hover:bg-secondary"
      aria-label="Toggle theme"
    >
      {computedColorScheme === 'dark' ? (
        <Sun className="h-5 w-5 text-foreground" />
      ) : (
        <Moon className="h-5 w-5 text-foreground" />
      )}
    </ActionIcon>
  );
}

export function ThemeSelector() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
      <Button
        variant={colorScheme === 'light' ? 'light' : 'subtle'}
        size="sm"
        onClick={() => setColorScheme('light')}
        className="h-7 px-2"
        leftSection={<Sun className="h-4 w-4" />}
      >
        Light
      </Button>
      <Button
        variant={colorScheme === 'dark' ? 'light' : 'subtle'}
        size="sm"
        onClick={() => setColorScheme('dark')}
        className="h-7 px-2"
        leftSection={<Moon className="h-4 w-4" />}
      >
        Dark
      </Button>
      <Button
        variant={colorScheme === 'auto' ? 'light' : 'subtle'}
        size="sm"
        onClick={() => setColorScheme('auto')}
        className="h-7 px-2"
        leftSection={<Monitor className="h-4 w-4" />}
      >
        Auto
      </Button>
    </div>
  );
}
