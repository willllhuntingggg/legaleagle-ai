import React, { useState } from 'react';
import { draftNewContract } from '../services/geminiService';
import { FileText, Loader2, Download, PenTool } from 'lucide-react';

export const ContractDrafting: React.FC = () => {
  const [type, setType] = useState('Service Agreement');
  const [requirements, setRequirements] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDraft = async () => {
    setLoading(true);
    const text = await draftNewContract(type, requirements);
    setResult(text);
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PenTool className="w-6 h-6 text-blue-600" />
            智能起草
        </h2>
        <p className="text-gray-500 mt-1">输入您的需求，AI 将为您生成专业的合同草案。</p>
      </div>

      <div className="flex gap-8 flex-1 min-h-0">
        <div className="w-1/3 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">合同类型</label>
            <select 
              className="w-full border p-2.5 rounded-lg mb-4 bg-white"
              value={type}
              onChange={e => setType(e.target.value)}
            >
              <option>服务合同 (Service Agreement)</option>
              <option>保密协议 (NDA)</option>
              <option>劳动合同 (Employment Contract)</option>
              <option>房屋租赁合同 (Lease Agreement)</option>
              <option>销售合同 (Sales Contract)</option>
            </select>

            <label className="block text-sm font-medium text-gray-700 mb-2">关键条款需求</label>
            <textarea 
              className="w-full border p-3 rounded-lg h-48 text-sm leading-relaxed"
              placeholder="例如：&#10;1. 甲方委托乙方开发APP&#10;2. 总金额50万元&#10;3. 工期3个月&#10;4. 违约金为总金额的20%"
              value={requirements}
              onChange={e => setRequirements(e.target.value)}
            />

            <button 
              onClick={handleDraft}
              disabled={loading || !requirements}
              className="w-full mt-4 bg-slate-900 text-white py-3 rounded-lg hover:bg-slate-800 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : '生成合同'}
            </button>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-8 overflow-y-auto relative">
          {result ? (
             <>
                <button className="absolute top-4 right-4 text-gray-500 hover:text-blue-600">
                    <Download className="w-5 h-5" />
                </button>
                <div className="prose max-w-none font-mono text-sm whitespace-pre-wrap text-gray-800">
                    {result}
                </div>
             </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-300">
                <FileText className="w-16 h-16 mb-4 opacity-20" />
                <p>草案将显示在这里</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};