import React from 'react';
import { Settings, Music, Mic, Users, Bell, Smartphone, Languages } from 'lucide-react';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useLanguage } from '../lib/LanguageContext';
import { Language } from '../lib/translations';

export function SettingsPanel() {
  const { t, language, setLanguage } = useLanguage();
  
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl mb-2">{t.appSettings}</h2>
        <p className="text-gray-600">Configure your application preferences</p>
      </div>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="w-5 h-5" />
            {t.appearance}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t.theme}</Label>
            <Select defaultValue="system">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t.light}</SelectItem>
                <SelectItem value="dark">{t.dark}</SelectItem>
                <SelectItem value="system">{t.system}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t.language}</Label>
            <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t.english}</SelectItem>
                <SelectItem value="pt">{t.portuguese}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audio Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            {t.audio}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t.audioOutput}</Label>
            <Select defaultValue="default">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">System Default</SelectItem>
                <SelectItem value="output-1">Built-in Output</SelectItem>
                <SelectItem value="output-2">Audio Interface (8 channels)</SelectItem>
                <SelectItem value="output-3">USB Audio Device</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Click Track Output</Label>
            <Select defaultValue="2">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Output 1-2 (Main)</SelectItem>
                <SelectItem value="2">Output 3-4 (Monitors)</SelectItem>
                <SelectItem value="3">Output 5-6</SelectItem>
                <SelectItem value="4">Output 7-8</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600">
              Route metronome and guide tracks to a separate output
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-gain Control</Label>
              <p className="text-sm text-gray-600">Automatically normalize audio levels</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>High Quality Pitch Shifting</Label>
              <p className="text-sm text-gray-600">Better quality, higher CPU usage</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* MIDI Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            {t.midi}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t.midiInput}</Label>
            <Select defaultValue="none">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="midi-1">MIDI Foot Controller</SelectItem>
                <SelectItem value="midi-2">USB MIDI Keyboard</SelectItem>
                <SelectItem value="midi-3">Virtual MIDI Bus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">{t.playPause}</Label>
              <Select defaultValue="cc1">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cc1">CC 1</SelectItem>
                  <SelectItem value="note60">Note C4</SelectItem>
                  <SelectItem value="none">Not Mapped</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Next Section</Label>
              <Select defaultValue="cc2">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cc2">CC 2</SelectItem>
                  <SelectItem value="note61">Note C#4</SelectItem>
                  <SelectItem value="none">Not Mapped</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Previous Section</Label>
              <Select defaultValue="cc3">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cc3">CC 3</SelectItem>
                  <SelectItem value="note62">Note D4</SelectItem>
                  <SelectItem value="none">Not Mapped</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Toggle Loop</Label>
              <Select defaultValue="cc4">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cc4">CC 4</SelectItem>
                  <SelectItem value="note63">Note D#4</SelectItem>
                  <SelectItem value="none">Not Mapped</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button variant="outline" className="w-full">
            Learn MIDI Controls
          </Button>
        </CardContent>
      </Card>

      {/* Collaboration Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Collaboration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-sync Settings</Label>
              <p className="text-sm text-gray-600">
                Automatically sync presets and notes across devices
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Offline Mode</Label>
              <p className="text-sm text-gray-600">
                Download songs for offline access
              </p>
            </div>
            <Switch />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Your Role</Label>
            <Select defaultValue="musician">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="leader">Worship Leader</SelectItem>
                <SelectItem value="musician">Musician</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Setlist Updates</Label>
              <p className="text-sm text-gray-600">
                Get notified when setlists are updated
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>New Song Versions</Label>
              <p className="text-sm text-gray-600">
                Alert when songs are updated
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Practice Reminders</Label>
              <p className="text-sm text-gray-600">
                Daily practice session reminders
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Display
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Performance Mode by Default</Label>
              <p className="text-sm text-gray-600">
                Start in performance mode for live events
              </p>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Show Waveforms</Label>
              <p className="text-sm text-gray-600">
                Display audio waveforms in track controls
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="space-y-2">
            <Label>Theme</Label>
            <Select defaultValue="light">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="auto">Auto (System)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
