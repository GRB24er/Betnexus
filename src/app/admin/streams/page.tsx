"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Loader2,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  X,
  Video,
  Crown,
} from "lucide-react";
import { api } from "@/lib/api";

type Stream = {
  _id: string;
  title: string;
  description?: string;
  sourceType: "hls" | "youtube" | "twitch" | "mp4" | "iframe";
  sourceUrl: string;
  thumbnail?: string;
  league?: string;
  active: boolean;
  viewers: number;
  premium: boolean;
  accessFee: number;
  createdAt: string;
};

export default function AdminStreamsPage() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState<Stream["sourceType"]>("youtube");
  const [sourceUrl, setSourceUrl] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [league, setLeague] = useState("");
  const [premium, setPremium] = useState(false);
  const [accessFee, setAccessFee] = useState("0");
  const [creating, setCreating] = useState(false);

  const fetchStreams = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ streams: Stream[] }>("/api/admin/streams");
      setStreams(res.streams);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreams();
  }, []);

  const create = async () => {
    if (!title || !sourceUrl) return;
    setCreating(true);
    try {
      await api.post("/api/admin/streams", {
        title,
        sourceType,
        sourceUrl,
        thumbnail,
        league,
        premium,
        accessFee: parseFloat(accessFee) || 0,
        active: true,
      });
      setTitle("");
      setSourceUrl("");
      setThumbnail("");
      setLeague("");
      setPremium(false);
      setAccessFee("0");
      setShowCreate(false);
      fetchStreams();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (s: Stream) => {
    await api.patch("/api/admin/streams", {
      id: s._id,
      action: s.active ? "deactivate" : "activate",
    });
    fetchStreams();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this stream?")) return;
    await api.patch("/api/admin/streams", { id, action: "delete" });
    fetchStreams();
  };

  return (
    <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-[#ff4757]" />
            Live Video Streams
          </h1>
          <p className="text-[11px] text-[#5a6485]">
            Publish live video streams users can watch in the platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 gradient-green rounded-lg text-xs font-bold text-white"
          >
            <Plus className="w-3.5 h-3.5" /> Add Stream
          </button>
          <button
            onClick={fetchStreams}
            className="p-2 text-[#8b95b8] hover:text-[#00d46e]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[#00d46e]" />
        </div>
      ) : streams.length === 0 ? (
        <div className="text-center py-16">
          <Video className="w-8 h-8 text-[#5a6485] mx-auto mb-3" />
          <p className="text-sm text-[#8b95b8]">No live streams yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {streams.map((s) => (
            <div
              key={s._id}
              className="bg-[#1c2033] border border-[#2a3050] rounded-xl overflow-hidden"
            >
              <div className="relative aspect-video bg-[#0f1118]">
                {s.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.thumbnail}
                    alt={s.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#5a6485]">
                    <Video className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1.5">
                  {s.active ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#ff4757]/90 text-white">
                      ● LIVE
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#2a3050] text-[#5a6485]">
                      OFF
                    </span>
                  )}
                  {s.premium && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#ffc107] text-black flex items-center gap-0.5">
                      <Crown className="w-2.5 h-2.5" /> GHS {s.accessFee.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-bold text-white truncate">
                  {s.title}
                </p>
                <p className="text-[10px] text-[#5a6485] mb-2">
                  {s.league || s.sourceType.toUpperCase()} ·{" "}
                  {s.viewers.toLocaleString()} viewers
                </p>
                <p className="text-[10px] text-[#5a6485] mb-2 truncate font-mono">
                  {s.sourceUrl}
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => toggleActive(s)}
                    className="flex-1 text-[10px] px-2 py-1.5 bg-[#3b82f6]/10 text-[#3b82f6] rounded flex items-center justify-center gap-1"
                  >
                    {s.active ? (
                      <>
                        <EyeOff className="w-3 h-3" /> Deactivate
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" /> Activate
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => remove(s._id)}
                    className="text-[10px] px-2 py-1.5 bg-[#ff4757]/10 text-[#ff4757] rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="bg-[#161925] border border-[#2a3050] rounded-2xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Add Live Stream</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="text-[#5a6485] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <Field label="Title" value={title} onChange={setTitle} />
              <div>
                <label className="text-[10px] text-[#5a6485] uppercase mb-1 block">
                  Source Type
                </label>
                <select
                  value={sourceType}
                  onChange={(e) =>
                    setSourceType(e.target.value as Stream["sourceType"])
                  }
                  className="w-full bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2.5 text-sm text-white"
                >
                  <option value="youtube">YouTube</option>
                  <option value="hls">HLS (.m3u8)</option>
                  <option value="twitch">Twitch</option>
                  <option value="mp4">MP4 URL</option>
                  <option value="iframe">Generic Iframe</option>
                </select>
              </div>
              <Field
                label="Source URL (or YouTube/Twitch ID)"
                value={sourceUrl}
                onChange={setSourceUrl}
              />
              <Field
                label="Thumbnail URL (optional)"
                value={thumbnail}
                onChange={setThumbnail}
              />
              <Field
                label="League / Category"
                value={league}
                onChange={setLeague}
              />
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-[#8b95b8]">
                  <input
                    type="checkbox"
                    checked={premium}
                    onChange={(e) => setPremium(e.target.checked)}
                  />
                  Premium
                </label>
                <div className="flex-1">
                  <Field
                    label="Access Fee (GHS)"
                    type="number"
                    value={accessFee}
                    onChange={setAccessFee}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2.5 text-xs font-medium text-[#8b95b8] bg-[#0f1118] border border-[#2a3050] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={create}
                  disabled={creating || !title || !sourceUrl}
                  className="flex-1 px-4 py-2.5 text-xs font-bold text-white gradient-green rounded-lg disabled:opacity-50"
                >
                  {creating ? (
                    <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                  ) : (
                    "Publish"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-[10px] text-[#5a6485] uppercase mb-1 block">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00d46e]/50"
      />
    </div>
  );
}
