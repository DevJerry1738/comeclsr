import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Heart, LogOut, Save, DollarSign, Mail, Home, MessageSquare } from "lucide-react";

export default function AdminSettings() {
  const { user, logout } = useAuth();
  const { data: allSettings, refetch } = trpc.settings.getAll.useQuery(undefined, { enabled: user?.role === "admin" });
  const updateSetting = trpc.settings.update.useMutation({ onSuccess: () => { toast.success("Saved!"); refetch(); } });

  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (allSettings) {
      const obj: Record<string, string> = {};
      allSettings.forEach(s => { if (s.value) obj[s.key] = s.value; });
      setForm(obj);
    }
  }, [allSettings]);

  const update = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const save = (key: string) => {
    updateSetting.mutate({ key, value: form[key] });
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      <header className="border-b border-white/10 bg-neutral-900/50 backdrop-blur-xl px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/admin"><Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white hover:bg-white/5"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center"><Heart className="w-4 h-4 text-white" /></div>
          <h1 className="font-semibold">System Settings</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} className="text-neutral-400 hover:text-red-400 hover:bg-red-500/10"><LogOut className="w-5 h-5" /></Button>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Tabs defaultValue="general">
          <TabsList className="bg-neutral-900 border border-neutral-800 mb-6">
            <TabsTrigger value="general" className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400"><Home className="w-4 h-4 mr-2" />General</TabsTrigger>
            <TabsTrigger value="payment" className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400"><DollarSign className="w-4 h-4 mr-2" />Payment</TabsTrigger>
            <TabsTrigger value="email" className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400"><Mail className="w-4 h-4 mr-2" />Email</TabsTrigger>
            <TabsTrigger value="popup" className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400"><MessageSquare className="w-4 h-4 mr-2" />Popup</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card className="bg-neutral-900/60 border-neutral-800">
              <CardHeader><CardTitle className="text-lg">General Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <SettingRow label="Platform Name" value={form["platform_name"] || ""} onChange={v => update("platform_name", v)} onSave={() => save("platform_name")} />
                <SettingRow label="Welcome Message" value={form["welcome_message"] || ""} onChange={v => update("welcome_message", v)} onSave={() => save("welcome_message")} isTextarea />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <Card className="bg-neutral-900/60 border-neutral-800">
              <CardHeader><CardTitle className="text-lg">Payment Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <SettingRow label="Platform Price ($)" value={form["platform_price"] || ""} onChange={v => update("platform_price", v)} onSave={() => save("platform_price")} />
                <SettingRow label="Payment Methods (JSON)" value={form["payment_methods"] || ""} onChange={v => update("payment_methods", v)} onSave={() => save("payment_methods")} isTextarea />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <Card className="bg-neutral-900/60 border-neutral-800">
              <CardHeader><CardTitle className="text-lg">SMTP Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <SettingRow label="SMTP Host" value={form["smtp_host"] || ""} onChange={v => update("smtp_host", v)} onSave={() => save("smtp_host")} />
                <SettingRow label="SMTP Port" value={form["smtp_port"] || ""} onChange={v => update("smtp_port", v)} onSave={() => save("smtp_port")} />
                <SettingRow label="SMTP User" value={form["smtp_user"] || ""} onChange={v => update("smtp_user", v)} onSave={() => save("smtp_user")} />
                <SettingRow label="SMTP Password" value={form["smtp_pass"] || ""} onChange={v => update("smtp_pass", v)} onSave={() => save("smtp_pass")} />
                <SettingRow label="From Email" value={form["smtp_from"] || ""} onChange={v => update("smtp_from", v)} onSave={() => save("smtp_from")} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="popup" className="space-y-4">
            <Card className="bg-neutral-900/60 border-neutral-800">
              <CardHeader><CardTitle className="text-lg">Landing Popup Content</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <SettingRow label="Popup Title" value={form["popup_title"] || ""} onChange={v => update("popup_title", v)} onSave={() => save("popup_title")} />
                <SettingRow label="Popup Body" value={form["popup_body"] || ""} onChange={v => update("popup_body", v)} onSave={() => save("popup_body")} isTextarea />
                <SettingRow label="Button Text" value={form["popup_button"] || ""} onChange={v => update("popup_button", v)} onSave={() => save("popup_button")} />
                <SettingRow label="Footer Text" value={form["popup_footer"] || ""} onChange={v => update("popup_footer", v)} onSave={() => save("popup_footer")} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SettingRow({ label, value, onChange, onSave, isTextarea }: { label: string; value: string; onChange: (v: string) => void; onSave: () => void; isTextarea?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <label className="text-sm text-neutral-400 block mb-1">{label}</label>
        {isTextarea ? (
          <textarea className="w-full p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm min-h-[80px]" value={value} onChange={e => onChange(e.target.value)} />
        ) : (
          <input className="w-full p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" value={value} onChange={e => onChange(e.target.value)} />
        )}
      </div>
      <Button size="sm" onClick={onSave} className="mt-6 bg-gradient-to-r from-rose-500 to-pink-600"><Save className="w-4 h-4" /></Button>
    </div>
  );
}
