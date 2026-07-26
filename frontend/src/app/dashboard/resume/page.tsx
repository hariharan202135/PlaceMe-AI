'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { 
  FileText, ShieldCheck, Sparkles, AlertCircle, Info, 
  UploadCloud, FileCheck, CheckCircle2, ChevronRight, 
  ShieldAlert, RefreshCw, Star, ArrowRight, Award, Trash2,
  Lock, Download, Plus, Sparkle, LayoutTemplate, Printer, Check
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface IResumeAnalysis {
  _id: string;
  fileName: string;
  atsScore: number;
  skillsIdentified: string[];
  education?: string;
  projects?: string[];
  internships?: string[];
  certifications?: string[];
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  suggestions: string[];
  interviewQuestions: string[];
  createdAt: string;
}

interface ISavedResume {
  _id?: string;
  template: 'classic' | 'modern' | 'minimal';
  name: string;
  role: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  photoUrl?: string;
  summary: string;
  skills: string[];
  experience: {
    company: string;
    role: string;
    duration: string;
    description: string;
  }[];
  projects: {
    title: string;
    technologies: string;
    description: string;
    link?: string;
  }[];
  education: {
    institution: string;
    degree: string;
    duration: string;
    grade?: string;
  }[];
  achievements: string[];
  certifications: string[];
  isPaid?: boolean;
}

export default function ResumePage() {
  const { user } = useAuth();

  const getAbsolutePhotoUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const baseUrl = apiUrl.replace(/\/api$/, '');
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };
  const [activeTab, setActiveTab] = useState<'analyser' | 'creator'>('analyser');
  
  // Mobile responsive scaling for resume preview
  const [previewScale, setPreviewScale] = useState(1);
  const previewContainerRef = useRef<HTMLDivElement>(null);


  // TAB 1: ANALYSER STATES & HANDLERS
  // ==========================================
  const [resumes, setResumes] = useState<IResumeAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeAnalysis, setActiveAnalysis] = useState<IResumeAnalysis | null>(null);
  const [viewState, setViewState] = useState<'upload' | 'result'>('upload');

  useEffect(() => {
    fetchResumeHistory();
    fetchCreatorResumes();
  }, []);

  const fetchResumeHistory = async () => {
    try {
      const response = await api.get('/resume/history');
      if (response.data.success) {
        setResumes(response.data.history);
      }
    } catch (err) {
      console.error('Error fetching resume history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear your entire resume scanning history?')) return;
    setLoading(true);
    try {
      const res = await api.delete('/resume/history');
      if (res.data.success) {
        setResumes([]);
        setActiveAnalysis(null);
        setViewState('upload');
      }
    } catch (err) {
      console.error('Error clearing resume history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setErrorMsg('Please upload a PDF file only.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setErrorMsg('');
    }
  };

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return;
    setAnalyzing(true);
    setErrorMsg('');

    try {
      const base64String = await getBase64(selectedFile);
      const payload = {
        file: base64String,
        fileName: selectedFile.name
      };

      const res = await api.post('/resume/analyze', payload);
      if (res.data.success) {
        const analysisData = res.data.analysis;
        setActiveAnalysis(analysisData);
        setViewState('result');
      }
    } catch (err: any) {
      console.error('Error uploading/analyzing resume:', err);
      setErrorMsg(err.response?.data?.message || 'Error occurred during resume parsing. Ensure it is a valid PDF.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCloseReport = () => {
    setViewState('upload');
    setActiveAnalysis(null);
    setSelectedFile(null);
    fetchResumeHistory();
  };

  // ==========================================
  // TAB 2: CREATOR STATES & HANDLERS
  // ==========================================
  const [savedResumes, setSavedResumes] = useState<ISavedResume[]>([]);
  const [activeResume, setActiveResume] = useState<ISavedResume>({
    template: 'classic',
    name: '',
    role: '',
    email: '',
    phone: '',
    linkedin: '',
    github: '',
    photoUrl: '',
    summary: '',
    skills: [],
    experience: [],
    projects: [],
    education: [],
    achievements: [],
    certifications: []
  });
  
  // Creator form state inputs
  const [skillInput, setSkillInput] = useState('');
  const [expInput, setExpInput] = useState({ company: '', role: '', duration: '', description: '' });
  const [projInput, setProjInput] = useState({ title: '', technologies: '', description: '', link: '' });
  const [eduInput, setEduInput] = useState({ institution: '', degree: '', duration: '', grade: '' });
  const [achInput, setAchInput] = useState('');
  const [certInput, setCertInput] = useState('');
  const [savingCreator, setSavingCreator] = useState(false);
  const [creatorMsg, setCreatorMsg] = useState('');
  const [creatorResumesLoading, setCreatorResumesLoading] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (previewContainerRef.current) {
        const width = previewContainerRef.current.offsetWidth;
        if (width < 800) {
          setPreviewScale(width / 800);
        } else {
          setPreviewScale(1);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    // Timeout helps ensure the container has rendered before measuring its width
    const timer = setTimeout(handleResize, 500);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [activeTab, activeResume?.template, activeResume?._id]);
  // Payment overlays
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutResumeId, setCheckoutResumeId] = useState<string | null>(null);
  const [upiTxRef, setUpiTxRef] = useState('');
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [selectedUpiPlatform, setSelectedUpiPlatform] = useState('gpay');

  const fetchCreatorResumes = async () => {
    setCreatorResumesLoading(true);
    try {
      const res = await api.get('/resume/my-resumes');
      if (res.data.success) {
        const list = res.data.resumes || [];
        setSavedResumes(list);
        if (list.length > 0) {
          const updated = await ensurePhotoIsBase64(list[0]);
          setActiveResume(normalizeResume(updated));
        }
      }
    } catch (err) {
      console.error('Error fetching user resumes:', err);
    } finally {
      setCreatorResumesLoading(false);
    }
  };

  const handleAddSkill = () => {
    if (skillInput.trim()) {
      setActiveResume(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const handleAddExperience = () => {
    if (expInput.company && expInput.role && expInput.duration && expInput.description) {
      setActiveResume(prev => ({
        ...prev,
        experience: [...prev.experience, { ...expInput }]
      }));
      setExpInput({ company: '', role: '', duration: '', description: '' });
    }
  };

  const handleAddProject = () => {
    if (projInput.title && projInput.technologies && projInput.description) {
      setActiveResume(prev => ({
        ...prev,
        projects: [...prev.projects, { ...projInput }]
      }));
      setProjInput({ title: '', technologies: '', description: '', link: '' });
    }
  };

  const handleAddEducation = () => {
    if (eduInput.institution && eduInput.degree && eduInput.duration) {
      setActiveResume(prev => ({
        ...prev,
        education: [...prev.education, { ...eduInput }]
      }));
      setEduInput({ institution: '', degree: '', duration: '', grade: '' });
    }
  };

  const handleAddAchievement = () => {
    if (achInput.trim()) {
      setActiveResume(prev => ({
        ...prev,
        achievements: [...prev.achievements, achInput.trim()]
      }));
      setAchInput('');
    }
  };

  const handleAddCertification = () => {
    if (certInput.trim()) {
      setActiveResume(prev => ({
        ...prev,
        certifications: [...prev.certifications, certInput.trim()]
      }));
      setCertInput('');
    }
  };

  const handleSaveResume = async () => {
    if (!activeResume.name || !activeResume.role || !activeResume.email || !activeResume.phone) {
      setCreatorMsg('⚠️ Please fill out at least your Name, Role, Email and Phone details.');
      return;
    }

    setSavingCreator(true);
    setCreatorMsg('');
    try {
      const payload = {
        id: activeResume._id,
        ...activeResume
      };
      const res = await api.post('/resume/create', payload);
      if (res.data.success) {
        setCreatorMsg('✨ Resume saved successfully!');
        setActiveResume(normalizeResume(res.data.resume));
        fetchCreatorResumes();
      }
    } catch (err: any) {
      console.error('Error saving resume:', err);
      setCreatorMsg('❌ Error saving resume details. Please try again.');
    } finally {
      setSavingCreator(false);
    }
  };

  const handleSelectResumeFromHistory = async (res: ISavedResume) => {
    const updated = await ensurePhotoIsBase64(res);
    setActiveResume(normalizeResume(updated));
    setCreatorMsg('');
  };

  const handleStartFreshResume = () => {
    setActiveResume({
      template: 'classic',
      name: '',
      role: '',
      email: '',
      phone: '',
      linkedin: '',
      github: '',
      photoUrl: '',
      summary: '',
      skills: [],
      experience: [],
      projects: [],
      education: [],
      achievements: [],
      certifications: []
    });
    setCreatorMsg('');
  };

  // Triggers checking permission and performing download
  const handleRequestDownload = async (format: 'pdf' | 'word') => {
    // Check if details are missing
    if (!activeResume.name || !activeResume.role || !activeResume.email || !activeResume.phone) {
      alert('⚠️ Please fill out at least your Name, Role, Email and Phone details first.');
      return;
    }

    let resumeToUse = activeResume;

    // Auto-save draft in the background (fire-and-forget) to sync changes and get an ID, without delaying the download thread.
    // This allows the browser to trigger downloads synchronously in the user-click frame, bypassing mobile pop-up blockers.
    const payload = {
      id: activeResume._id,
      ...activeResume
    };
    api.post('/resume/create', payload)
      .then(saveRes => {
        if (saveRes.data.success) {
          setActiveResume(normalizeResume(saveRes.data.resume));
          fetchCreatorResumes();
        }
      })
      .catch(err => {
        console.error('Background draft save failed:', err);
      });

    if (format === 'pdf') {
      await printResumeToPDF(activeResume);
    } else {
      await performDownloadWord(activeResume);
    }
  };

  const handleAnalyzeCreatedResume = async () => {
    if (!activeResume.name || !activeResume.role) {
      alert('⚠️ Please fill out at least your Name and Target Role first before analyzing.');
      return;
    }
    setAnalyzing(true);
    try {
      const summaryText = `
        ${activeResume.name} - ${activeResume.role}
        Contact: ${activeResume.email} | ${activeResume.phone}
        Professional Summary: ${activeResume.summary}
        Technical Skills: ${activeResume.skills?.join(', ')}
        Work Experience: ${activeResume.experience?.map(e => `${e.role} at ${e.company} (${e.duration}): ${e.description}`).join('; ')}
        Education: ${activeResume.education?.map(ed => `${ed.degree} from ${ed.institution} (${ed.duration})`).join('; ')}
        Key Projects: ${activeResume.projects?.map(p => `${p.title} (${p.technologies}): ${p.description}`).join('; ')}
        Certifications: ${activeResume.certifications?.join(', ')}
      `.trim();

      const dummyPdfHeader = `%PDF-1.4\n1 0 obj\n<<\n/Title (${activeResume.name} Resume)\n/Subject (ATS Analysis)\n>>\nendobj\nstream\n${summaryText}\nendstream\nendobj\n%%EOF`;
      const base64Pdf = Buffer.from(dummyPdfHeader, 'utf-8').toString('base64');

      const res = await api.post('/resume/analyze', {
        file: `data:application/pdf;base64,${base64Pdf}`,
        fileName: `${activeResume.name}_Builder_Resume.pdf`
      });

      if (res.data.success) {
        setActiveAnalysis(res.data.analysis);
        setActiveTab('analyser');
        setViewState('result');
        fetchResumeHistory();
      }
    } catch (err: any) {
      console.error('Error analyzing builder resume:', err);
      alert('Failed to analyze created resume: ' + (err.response?.data?.message || err.message || err));
    } finally {
      setAnalyzing(false);
    }
  };

  const [loadingPDF, setLoadingPDF] = useState(false);
  const [loadingWord, setLoadingWord] = useState(false);

  const loadHtml2Pdf = async () => {
    if (typeof window === 'undefined') return null;
    if ((window as any).html2pdf) return (window as any).html2pdf;

    try {
      const html2pdfModule = await import('html2pdf.js');
      const h2p = html2pdfModule.default || (html2pdfModule as any);
      if (h2p) {
        (window as any).html2pdf = h2p;
        return h2p;
      }
    } catch (e) {
      console.warn('Local html2pdf package import fallback:', e);
    }

    return new Promise<any>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => resolve((window as any).html2pdf);
      script.onerror = () => reject(new Error('Failed to load html2pdf script'));
      document.head.appendChild(script);
    });
  };

  const toHexOrRgb = (colorStr: string, defaultFallback: string = '#111827'): string => {
    if (!colorStr || colorStr === 'transparent' || colorStr === 'inherit' || colorStr === 'initial' || colorStr === 'none') {
      return defaultFallback;
    }
    if (/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(colorStr) || /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/.test(colorStr)) {
      return colorStr;
    }
    if (typeof document !== 'undefined') {
      try {
        const canvasCtx = document.createElement('canvas').getContext('2d');
        if (canvasCtx) {
          canvasCtx.fillStyle = colorStr;
          const hex = canvasCtx.fillStyle;
          if (hex && hex !== '#000000' && /^#[0-9a-fA-F]{6}$/.test(hex)) {
            return hex;
          }
        }
      } catch (e) {}
    }
    return defaultFallback;
  };

  const createCleanInlineClone = (sourceEl: HTMLElement): HTMLElement => {
    const clone = sourceEl.cloneNode(true) as HTMLElement;
    const sourceNodes = [sourceEl, ...Array.from(sourceEl.querySelectorAll('*'))];
    const cloneNodes = [clone, ...Array.from(clone.querySelectorAll('*'))];

    const colorProps = ['color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'];

    sourceNodes.forEach((srcNode, index) => {
      const targetNode = cloneNodes[index] as HTMLElement;
      if (!targetNode || !srcNode) return;

      if (srcNode.nodeType === Node.ELEMENT_NODE) {
        try {
          const computed = window.getComputedStyle(srcNode as HTMLElement);

          targetNode.style.fontFamily = 'Arial, Helvetica, sans-serif';
          if (computed.fontSize) targetNode.style.fontSize = computed.fontSize;
          if (computed.fontWeight) targetNode.style.fontWeight = computed.fontWeight;
          if (computed.lineHeight) targetNode.style.lineHeight = computed.lineHeight;
          if (computed.letterSpacing) targetNode.style.letterSpacing = computed.letterSpacing;
          if (computed.textAlign) targetNode.style.textAlign = computed.textAlign;
          if (computed.textTransform) targetNode.style.textTransform = computed.textTransform;
          if (computed.whiteSpace) targetNode.style.whiteSpace = computed.whiteSpace;
          targetNode.style.boxSizing = 'border-box';
          if (computed.display) targetNode.style.display = computed.display === 'inline' ? 'inline-block' : computed.display;
          if (computed.flexDirection) targetNode.style.flexDirection = computed.flexDirection;
          if (computed.justifyContent) targetNode.style.justifyContent = computed.justifyContent;
          if (computed.alignItems) targetNode.style.alignItems = computed.alignItems;
          if (computed.gap) targetNode.style.gap = computed.gap;

          if (computed.padding) targetNode.style.padding = computed.padding;
          if (computed.margin) targetNode.style.margin = computed.margin;
          if (computed.borderRadius) targetNode.style.borderRadius = computed.borderRadius;

          colorProps.forEach((prop) => {
            const val = computed[prop as any];
            if (val && val !== 'rgba(0, 0, 0, 0)' && val !== 'transparent') {
              const fallback = prop === 'color' ? '#111827' : prop === 'backgroundColor' ? '#ffffff' : '#e5e7eb';
              targetNode.style[prop as any] = toHexOrRgb(val, fallback);
            }
          });

          // Strip class attributes to neutralize Tailwind class matching
          targetNode.removeAttribute('class');
        } catch (e) {
          console.warn('Error inlining computed node style:', e);
        }
      }
    });

    return clone;
  };

  const printResumeToPDF = async (res: ISavedResume) => {
    if (activeTab !== 'creator') {
      setActiveTab('creator');
      await new Promise(r => setTimeout(r, 150));
    }

    const printContent = document.getElementById('printable-resume-preview');
    if (!printContent) {
      alert('Could not find resume preview to export.');
      return;
    }

    setLoadingPDF(true);
    let tempWrapper: HTMLDivElement | null = null;

    try {
      const html2pdf = await loadHtml2Pdf();
      if (!html2pdf) throw new Error('html2pdf library could not be initialized');

      const safeName = (res?.name || 'Resume').trim().replace(/[^a-zA-Z0-9_-]/g, '_');

      // Create isolated top-level container locked to viewport
      tempWrapper = document.createElement('div');
      tempWrapper.id = 'pdf-printable-container';
      tempWrapper.style.position = 'fixed';
      tempWrapper.style.top = '0';
      tempWrapper.style.left = '0';
      tempWrapper.style.width = '210mm';
      tempWrapper.style.minHeight = '297mm';
      tempWrapper.style.zIndex = '99999';
      tempWrapper.style.background = '#ffffff';
      tempWrapper.style.color = '#000000';
      tempWrapper.style.padding = '15mm';
      tempWrapper.style.boxSizing = 'border-box';
      tempWrapper.style.overflow = 'visible';
      tempWrapper.style.pointerEvents = 'none';
      tempWrapper.style.opacity = '0.999';

      // Append clean inlined clone of the resume preview
      const cleanClone = createCleanInlineClone(printContent);
      tempWrapper.appendChild(cleanClone);

      document.body.appendChild(tempWrapper);

      // Convert images to base64 data URLs
      const imgs = tempWrapper.querySelectorAll('img');
      const promises = Array.from(imgs).map(async (img) => {
        if (img.src && !img.src.startsWith('data:')) {
          try {
            const base64 = await getBase64Image(img.src);
            img.src = base64;
          } catch (e) {
            console.warn('Failed to inline image for PDF:', img.src, e);
          }
        }
      });
      await Promise.all(promises);

      const opt = {
        margin:       [0, 0, 0, 0],
        filename:     `${safeName}_Resume.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true, 
          allowTaint: true,
          letterRendering: true,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
          onclone: (clonedDoc: Document) => {
            // Remove all style and link tags from cloned doc to eliminate Tailwind v4 lab/oklch rules
            const styleTags = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
            styleTags.forEach((tag) => {
              if (tag.parentNode) tag.parentNode.removeChild(tag);
            });
            if (clonedDoc.body) {
              clonedDoc.body.style.background = '#ffffff';
              clonedDoc.body.style.color = '#111827';
            }
          }
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await new Promise(resolve => setTimeout(resolve, 150));

      await html2pdf().from(tempWrapper).set(opt).save();
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Error details: ' + (err?.message || err));
    } finally {
      if (tempWrapper && tempWrapper.parentNode) {
        tempWrapper.parentNode.removeChild(tempWrapper);
      }
      setLoadingPDF(false);
    }
  };

  const getBase64Image = async (imgUrl: string): Promise<string> => {
    try {
      if (!imgUrl) return '';
      if (imgUrl.startsWith('data:')) {
        return imgUrl;
      }
      const response = await fetch(imgUrl);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error('Error fetching image for base64 conversion:', e);
      return imgUrl;
    }
  };

  const ensurePhotoIsBase64 = async (resume: ISavedResume): Promise<ISavedResume> => {
    if (resume && resume.photoUrl && !resume.photoUrl.startsWith('data:')) {
      const absoluteUrl = getAbsolutePhotoUrl(resume.photoUrl);
      try {
        const base64 = await getBase64Image(absoluteUrl);
        return {
          ...resume,
          photoUrl: base64
        };
      } catch (e) {
        console.error('Failed to convert resume photo to base64 on load:', e);
      }
    }
    return resume;
  };

  const normalizeResume = (resume: any): ISavedResume => {
    if (!resume) {
      return {
        template: 'classic',
        name: '',
        role: '',
        email: '',
        phone: '',
        linkedin: '',
        github: '',
        photoUrl: '',
        summary: '',
        skills: [],
        experience: [],
        projects: [],
        education: [],
        achievements: [],
        certifications: [],
        _id: ''
      };
    }
    return {
      template: resume.template || 'classic',
      name: resume.name || '',
      role: resume.role || '',
      email: resume.email || '',
      phone: resume.phone || '',
      linkedin: resume.linkedin || '',
      github: resume.github || '',
      photoUrl: resume.photoUrl || '',
      summary: resume.summary || '',
      skills: Array.isArray(resume.skills) ? resume.skills : [],
      experience: Array.isArray(resume.experience) ? resume.experience : [],
      projects: Array.isArray(resume.projects) ? resume.projects : [],
      education: Array.isArray(resume.education) ? resume.education : [],
      achievements: Array.isArray(resume.achievements) ? resume.achievements : [],
      certifications: Array.isArray(resume.certifications) ? resume.certifications : [],
      _id: resume._id
    };
  };

  const performDownloadWord = async (res: ISavedResume) => {
    setLoadingWord(true);
    try {
      let base64Photo = '';
      let mimeType = 'image/png';
      
      const photoSrc = res.photoUrl || '';
      if (photoSrc) {
        let base64String = '';
        if (photoSrc.startsWith('data:')) {
          base64String = photoSrc;
        } else {
          try {
            base64String = await getBase64Image(getAbsolutePhotoUrl(photoSrc));
          } catch (e) {
            console.error('Failed to get base64 image for Word:', e);
          }
        }
        
        if (base64String.startsWith('data:')) {
          const parts = base64String.split(';');
          if (parts.length > 1) {
            mimeType = parts[0].replace('data:', '');
            const dataParts = parts[1].split(',');
            if (dataParts.length > 1) {
              base64Photo = dataParts[1];
            }
          }
        }
      }

      const safeName = (res?.name || 'Resume').trim().replace(/[^a-zA-Z0-9_-]/g, '_');

      const skillsRows = (res.skills || []).map(s => {
        if (typeof s === 'string' && s.includes(':')) {
          const [category, tags] = s.split(/:\s*/);
          return `
            <tr>
              <td valign="top" style="width: 25%; font-weight: bold; font-size: 9pt; font-family: Arial, sans-serif; padding: 3px 0; text-transform: uppercase; color: #111;">
                ${category}:
              </td>
              <td valign="top" style="width: 75%; padding: 3px 0; font-size: 9pt; font-family: Arial, sans-serif; color: #333;">
                ${tags}
              </td>
            </tr>
          `;
        }
        return `
          <tr>
            <td colspan="2" style="font-size: 9pt; font-family: Arial, sans-serif; padding: 2px 0; color: #333;">
              &bull; ${s}
            </td>
          </tr>
        `;
      }).join('');

      const experienceBlocks = (res.experience || []).map(exp => `
        <div style="margin-bottom: 12px; font-family: Arial, sans-serif;">
          <table border="0" cellpadding="0" cellspacing="0" style="width: 100%;">
            <tr>
              <td align="left" style="font-weight: bold; font-size: 10pt; color: #111;">${exp.company}</td>
              <td align="right" style="font-size: 9pt; color: #666;">${exp.duration}</td>
            </tr>
            <tr>
              <td align="left" style="font-size: 9pt; color: #2563eb; font-weight: bold; font-style: italic;">${exp.role}</td>
              <td align="right"></td>
            </tr>
          </table>
          <div style="font-size: 9pt; color: #333; margin-top: 4px; line-height: 1.4;">
            ${exp.description}
          </div>
        </div>
      `).join('');

      const projectBlocks = (res.projects || []).map(proj => `
        <div style="margin-bottom: 12px; font-family: Arial, sans-serif;">
          <table border="0" cellpadding="0" cellspacing="0" style="width: 100%;">
            <tr>
              <td align="left" style="font-weight: bold; font-size: 10pt; color: #111;">${proj.title}</td>
              <td align="right" style="font-size: 8.5pt; color: #2563eb;">${proj.link || ''}</td>
            </tr>
          </table>
          <div style="font-size: 8.5pt; color: #4b5563; font-weight: bold; margin-top: 2px;">
            Tech Stack: ${proj.technologies}
          </div>
          <div style="font-size: 9pt; color: #333; margin-top: 4px; line-height: 1.4;">
            ${proj.description}
          </div>
        </div>
      `).join('');

      const educationBlocks = (res.education || []).map(edu => `
        <div style="margin-bottom: 8px; font-family: Arial, sans-serif;">
          <table border="0" cellpadding="0" cellspacing="0" style="width: 100%;">
            <tr>
              <td align="left" style="font-weight: bold; font-size: 9.5pt; color: #111;">${edu.institution}</td>
              <td align="right" style="font-size: 8.5pt; color: #666;">${edu.duration}</td>
            </tr>
            <tr>
              <td align="left" style="font-size: 8.5pt; color: #555;">${edu.degree}</td>
              <td align="right" style="font-size: 8.5pt; color: #111; font-weight: bold;">${edu.grade ? `Grade: ${edu.grade}` : ''}</td>
            </tr>
          </table>
        </div>
      `).join('');

      const achievementsList = (res.achievements || []).map(ach => `
        <li style="font-size: 9pt; font-family: Arial, sans-serif; color: #333; margin-bottom: 4px;">${ach}</li>
      `).join('');

      const certificationsList = (res.certifications || []).map(c => `
        <li style="font-size: 9pt; font-family: Arial, sans-serif; color: #333; margin-bottom: 4px;">${c}</li>
      `).join('');

      const sourceHTML = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office"
              xmlns:w="urn:schemas-microsoft-com:office:word"
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>${res.name || 'Resume'}</title>
          <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
          <style>
            body { font-family: Arial, sans-serif; color: #111111; background-color: #ffffff; margin: 0; padding: 25px; line-height: 1.4; }
            h2 { font-size: 20pt; margin: 0; text-transform: uppercase; color: #111111; }
            h3 { font-size: 10pt; font-weight: bold; text-transform: uppercase; border-bottom: 1.5px solid #111111; padding-bottom: 3px; margin-top: 16px; margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-bottom: 2px solid #111111; padding-bottom: 12px; margin-bottom: 15px;">
            <tr>
              ${base64Photo ? `
              <td valign="top" style="width: 80px; padding-right: 15px;">
                <img src="cid:resume-photo" width="70" height="70" style="border-radius: 35px; border: 1px solid #dddddd;" />
              </td>
              ` : ''}
              <td valign="top" align="left">
                <h2>${res.name || 'YOUR FULL NAME'}</h2>
                <div style="font-size: 10pt; font-weight: bold; color: #374151; text-transform: uppercase; margin-top: 3px;">
                  ${res.role || 'TARGET PROFESSIONAL ROLE'}
                </div>
                <div style="font-size: 8.5pt; color: #4b5563; margin-top: 6px; line-height: 1.3;">
                  ${res.phone ? `Phone: ${res.phone}` : ''}
                  ${res.email ? ` &bull; Email: ${res.email}` : ''}
                  ${res.linkedin ? ` &bull; LinkedIn: ${res.linkedin}` : ''}
                  ${res.github ? ` &bull; GitHub: ${res.github}` : ''}
                </div>
              </td>
            </tr>
          </table>

          ${res.summary ? `<div><h3>Professional Summary</h3><p style="font-size: 9pt; color: #333; margin: 0; line-height: 1.4;">${res.summary}</p></div>` : ''}
          ${res.skills.length > 0 ? `<div><h3>Technical Skills</h3><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;">${skillsRows}</table></div>` : ''}
          ${res.experience.length > 0 ? `<div><h3>Work Experience</h3>${experienceBlocks}</div>` : ''}
          ${res.projects.length > 0 ? `<div><h3>Key Projects</h3>${projectBlocks}</div>` : ''}
          ${res.education.length > 0 ? `<div><h3>Education</h3>${educationBlocks}</div>` : ''}
          ${res.achievements.length > 0 ? `<div><h3>Achievements</h3><ul>${achievementsList}</ul></div>` : ''}
          ${res.certifications.length > 0 ? `<div><h3>Certifications</h3><ul>${certificationsList}</ul></div>` : ''}
        </body>
        </html>
      `;

      let fileContent = '';
      let blobType = 'application/msword;charset=utf-8';
      
      if (base64Photo) {
        blobType = 'message/rfc822';
        fileContent = `MIME-Version: 1.0
Content-Type: multipart/related; boundary="next-part"; type="text/html"

--next-part
Content-Type: text/html; charset="utf-8"
Content-Transfer-Encoding: 8bit

${sourceHTML}

--next-part
Content-Type: ${mimeType}
Content-Transfer-Encoding: base64
Content-ID: <resume-photo>

${base64Photo}

--next-part--`;
      } else {
        fileContent = '\ufeff' + sourceHTML;
      }

      const blob = new Blob([fileContent], { type: blobType });
      const blobUrl = URL.createObjectURL(blob);
      
      if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        window.location.href = blobUrl;
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 5000);
      } else {
        const fileDownload = document.createElement("a");
        fileDownload.style.display = "none";
        document.body.appendChild(fileDownload);
        fileDownload.href = blobUrl;
        fileDownload.download = `${safeName}_Resume.doc`;
        fileDownload.click();
        setTimeout(() => {
          if (fileDownload.parentNode) {
            fileDownload.parentNode.removeChild(fileDownload);
          }
          URL.revokeObjectURL(blobUrl);
        }, 1000);
      }
    } catch (err: any) {
      console.error('Error generating Word document:', err);
      alert('Failed to generate Word document. Error details: ' + (err?.message || err));
    } finally {
      setLoadingWord(false);
    }
  };

  const handleSimulateCreatorPayment = async () => {
    if (!upiTxRef || upiTxRef.trim().length !== 12 || isNaN(Number(upiTxRef.trim()))) {
      alert('⚠️ Please enter a valid 12-digit UPI transaction reference / UTR number.');
      return;
    }

    setVerifyingPayment(true);
    try {
      // Simulate real-time transaction query verification
      await new Promise(resolve => setTimeout(resolve, 1500));
      const res = await api.post('/resume/pay-download');
      if (res.data.success) {
        setShowCheckoutModal(false);
        setCheckoutResumeId(null);
        setUpiTxRef('');
        alert('✨ UPI Transaction Verified Successfully! ₹5 payment confirmed. One download token credit added. Click Download PDF / Word to generate your copy.');
        fetchCreatorResumes();
      }
    } catch (err) {
      console.error('Error registering payment:', err);
      alert('UPI transaction verification failed. Please try again.');
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleDeleteResume = async (resId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      const res = await api.delete(`/resume/${resId}`);
      if (res.data.success) {
        if (activeResume._id === resId) {
          handleStartFreshResume();
        }
        fetchCreatorResumes();
      }
    } catch (err) {
      console.error('Error deleting resume:', err);
    }
  };

  if (loading && viewState === 'upload') {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
        <div className="h-10 bg-muted rounded-xl w-72" />
        
        <div className="space-y-3">
          <div className="h-8 bg-muted rounded-xl w-60" />
          <div className="h-4 bg-muted rounded-xl w-96" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 h-80 border border-border bg-card/30 p-6 rounded-2xl space-y-4">
            <div className="h-6 bg-muted rounded-lg w-1/3" />
            <div className="h-4 bg-muted rounded-lg w-full" />
            <div className="h-32 bg-muted/40 rounded-xl" />
            <div className="h-10 bg-muted rounded-xl w-full" />
          </div>
          
          <div className="lg:col-span-2 h-80 border border-border bg-card/30 p-6 rounded-2xl space-y-4">
            <div className="h-6 bg-muted rounded-lg w-1/4" />
            <div className="h-4 bg-muted rounded-lg w-1/3" />
            <div className="space-y-3 pt-2">
              <div className="h-14 bg-muted/30 rounded-xl w-full" />
              <div className="h-14 bg-muted/30 rounded-xl w-full" />
              <div className="h-14 bg-muted/30 rounded-xl w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-border bg-card/15 p-1 rounded-xl w-fit">
        {[
          { id: 'analyser', name: 'ATS Resume Analyser' },
          { id: 'creator', name: 'ATS Resume Creator & Builder' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4.5 py-2.5 rounded-lg text-xs font-bold transition ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* ==================================================== */}
      {/* TAB 1: ATS ANALYSER */}
      {/* ==================================================== */}
      {activeTab === 'analyser' && (
        <>
          {viewState === 'upload' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">ATS Resume Analyser</h1>
                <p className="text-sm text-muted-foreground">
                  Upload your engineering resume (PDF format). Gemini AI will parse text to compute your ATS compatibility score.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload form Panel */}
                <div className="lg:col-span-1 border border-border bg-card/30 p-6 rounded-2xl space-y-4">
                  <h3 className="text-lg font-bold">Upload Resume</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Drag and drop your resume or click to select a file from local storage. Only text-based PDF formats are parsed.
                  </p>

                  {errorMsg && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl p-3 text-xs flex items-center space-x-2">
                      <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Upload Box */}
                  {!selectedFile ? (
                    <div className="border-2 border-dashed border-border rounded-xl p-8 hover:border-primary/50 transition cursor-pointer text-center relative">
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <UploadCloud className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <span className="text-xs font-semibold text-foreground block">Choose PDF resume</span>
                      <span className="text-[10px] text-muted-foreground">Max size: 5MB</span>
                    </div>
                  ) : (
                    <div className="border border-primary bg-primary/5 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5 truncate max-w-[80%]">
                        <FileCheck className="w-7 h-7 text-primary flex-shrink-0" />
                        <div className="truncate">
                          <span className="text-xs font-bold text-foreground block truncate">{selectedFile.name}</span>
                          <span className="text-[10px] text-muted-foreground">{(selectedFile.size / 1024).toFixed(0)} KB</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="p-1.5 text-muted-foreground hover:text-red-500 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <button
                    disabled={!selectedFile || analyzing}
                    onClick={handleUploadAndAnalyze}
                    className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition disabled:opacity-50"
                  >
                    {analyzing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Gemini scanning structure...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Analyze ATS Match</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Past histories logs */}
                <div className="lg:col-span-2 border border-border bg-card/30 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold">Past Resume Analyses</h3>
                      <p className="text-xs text-muted-foreground">Logs of your pre-scanned resumes.</p>
                    </div>
                    {resumes.length > 0 && (
                      <button
                        onClick={handleClearHistory}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/10 text-[10px] font-bold transition flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear History</span>
                      </button>
                    )}
                  </div>

                  {resumes.length === 0 ? (
                    <div className="border border-dashed border-border/80 bg-muted/10 p-10 rounded-2xl text-center max-w-md mx-auto space-y-4 my-4">
                      <div className="bg-primary/10 text-primary p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto shadow-inner">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-foreground">No Resume Scans Yet</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                          Scan your engineering resume to calculate ATS keyword matching, check strengths, and discover customized interview preparation questions.
                        </p>
                      </div>
                      <div className="pt-1">
                        <span className="inline-flex items-center text-[9px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          Ready to Scan
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3.5 overflow-y-auto max-h-[300px] pr-2">
                      {resumes.map((item) => (
                        <div 
                          key={item._id} 
                          className="p-4 border border-border bg-background rounded-xl flex items-center justify-between hover:border-primary/30 transition cursor-pointer"
                          onClick={() => {
                            setActiveAnalysis(item);
                            setViewState('result');
                          }}
                        >
                          <div className="space-y-1 truncate max-w-[70%]">
                            <h4 className="font-bold text-sm text-foreground truncate">{item.fileName}</h4>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(item.createdAt).toLocaleDateString()} • {item.skillsIdentified?.length || 0} Skills Detected
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 text-xs">
                            <div className="text-right">
                              <span className="text-xs font-black text-primary block">{item.atsScore}% ATS Score</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                item.atsScore >= 70 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                              }`}>
                                {item.atsScore >= 70 ? 'Strong' : 'Improve'}
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {viewState === 'result' && activeAnalysis && (
            <div className="space-y-8 text-left">
              {/* Summary dashboard Header */}
              <div className="border border-border bg-card/35 p-8 rounded-2xl relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
                
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                  <div className="space-y-2">
                    <div className="inline-flex items-center space-x-1 text-xs font-semibold uppercase tracking-widest text-primary bg-primary/15 px-3 py-1 rounded-full">
                      <Award className="w-3.5 h-3.5" />
                      <span>ATS Compatibility Report</span>
                    </div>
                    <h2 className="text-2xl font-extrabold tracking-tight truncate max-w-[320px] sm:max-w-md">
                      {activeAnalysis.fileName}
                    </h2>
                    <p className="text-xs text-muted-foreground">Extracted education credentials and parsed skills listing below.</p>
                  </div>

                  {/* Gauge indicator */}
                  <div className="p-5 border border-border bg-background rounded-2xl text-center space-y-0.5 w-fit flex-shrink-0">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">ATS Match</span>
                    <span className="text-3xl font-black text-primary block">{activeAnalysis.atsScore}%</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase block mt-1 ${
                      activeAnalysis.atsScore >= 70 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {activeAnalysis.atsScore >= 70 ? 'High Chance' : 'Needs Optimization'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Qualifications / Projects */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border border-border bg-card/30 rounded-2xl space-y-3">
                  <h3 className="font-bold text-sm text-foreground border-b border-border pb-2 block">Extracted Qualifications</h3>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Education:</span>
                      <span className="font-semibold text-foreground">{activeAnalysis.education || 'B.Tech / Science equivalent'}</span>
                    </div>
                    {activeAnalysis.certifications && activeAnalysis.certifications.length > 0 && (
                      <div>
                        <span className="text-muted-foreground block">Certifications identified:</span>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1 pt-1 font-semibold">
                          {activeAnalysis.certifications.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 border border-border bg-card/30 rounded-2xl space-y-3">
                  <h3 className="font-bold text-sm text-foreground border-b border-border pb-2 block">Projects Identified</h3>
                  {activeAnalysis.projects && activeAnalysis.projects.length > 0 ? (
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1.5 font-semibold">
                      {activeAnalysis.projects.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  ) : (
                    <span className="text-xs text-muted-foreground">No prominent projects extracted.</span>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div className="p-6 border border-border bg-card/30 rounded-2xl space-y-5">
                <h3 className="font-extrabold text-sm">Skills Parsing Breakdown</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground block mb-2">Identified Core Competencies</span>
                    <div className="flex flex-wrap gap-2">
                      {activeAnalysis.skillsIdentified?.map((s, idx) => (
                        <span key={idx} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-3 py-1 rounded-xl text-xs font-bold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {activeAnalysis.missingSkills && activeAnalysis.missingSkills.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground block mb-2">Recommended Industry Keywords Missing</span>
                      <div className="flex flex-wrap gap-2">
                        {activeAnalysis.missingSkills.map((s, idx) => (
                          <span key={idx} className="bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-1 rounded-xl text-xs font-bold">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border border-border bg-card/30 rounded-2xl space-y-3">
                  <h3 className="font-bold text-sm text-foreground">ATS Strengths</h3>
                  <ul className="list-disc list-inside text-xs text-muted-foreground space-y-2 leading-relaxed">
                    {activeAnalysis.strengths?.map((str, i) => <li key={i}>{str}</li>)}
                  </ul>
                </div>

                <div className="p-6 border border-border bg-card/30 rounded-2xl space-y-3">
                  <h3 className="font-bold text-sm text-foreground">ATS Weaknesses</h3>
                  <ul className="list-disc list-inside text-xs text-muted-foreground space-y-2 leading-relaxed">
                    {activeAnalysis.weaknesses?.map((wk, i) => <li key={i}>{wk}</li>)}
                  </ul>
                </div>
              </div>

              {/* Suggestions */}
              <div className="p-6 border border-border bg-card/30 rounded-2xl space-y-3">
                <h3 className="font-bold text-sm text-foreground">Suggestions for ATS Optimization</h3>
                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-2 leading-relaxed">
                  {activeAnalysis.suggestions?.map((sug, i) => <li key={i}>{sug}</li>)}
                </ul>
              </div>

              {/* Interview questions */}
              {activeAnalysis.interviewQuestions && activeAnalysis.interviewQuestions.length > 0 && (
                <div className="p-6 border border-border bg-card/30 rounded-2xl space-y-4">
                  <h3 className="font-bold text-sm text-foreground">Personalized Interview Questions (Based on your projects)</h3>
                  <div className="space-y-3">
                    {activeAnalysis.interviewQuestions.map((q, idx) => (
                      <div key={idx} className="p-4 border border-border bg-background rounded-xl text-xs font-semibold leading-relaxed flex items-start space-x-2">
                        <Info className="w-4.5 h-4.5 text-primary flex-shrink-0" />
                        <span>{q}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleCloseReport}
                  className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-6 py-3 rounded-xl text-sm transition shadow"
                >
                  Back to Uploader
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ==================================================== */}
      {/* TAB 2: ATS CREATOR & BUILDER */}
      {/* ==================================================== */}
      {activeTab === 'creator' && (
        <div className="space-y-6 text-left">
          {/* Header & Description */}
          <div className="p-6 border border-border bg-card/35 rounded-2xl space-y-3 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
            <h1 className="text-2xl font-black text-foreground relative z-10">ATS-Friendly Resume Creator</h1>
            <p className="text-xs text-muted-foreground leading-relaxed relative z-10">
              Input your details in the precise logical order scanned by ATS parsers. Recommend using the **Classic Professional** layout for maximum scoring compatibility.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT INPUTS FORM: 5/12 cols */}
            <div className="lg:col-span-5 space-y-6">

              {/* Form card */}
              <div className="p-6 border border-border bg-card/30 rounded-2xl space-y-5">
                <h3 className="font-bold text-base border-b border-border pb-2">Resume Details</h3>
                
                {/* 1. Template Selection */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-muted-foreground block">Select Resume Template</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'classic', label: 'Classic (ATS Best)', desc: 'Standard B&W' },
                      { id: 'modern', label: 'Modern Creative', desc: 'Left sidebar' },
                      { id: 'minimal', label: 'Minimalist Tech', desc: 'Bold headings' }
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setActiveResume(prev => ({ ...prev, template: t.id as any }))}
                        className={`p-2 border.5 rounded-xl text-center space-y-0.5 transition ${
                          activeResume.template === t.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background/50 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span className="text-[10px] font-black block">{t.label}</span>
                        <span className="text-[8px] opacity-75 block">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Photo Upload */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground block">Profile Photo (Optional)</label>
                  <div className="flex items-center space-x-3">
                    {activeResume.photoUrl ? (
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <img
                          src={getAbsolutePhotoUrl(activeResume.photoUrl)}
                          crossOrigin={activeResume.photoUrl?.startsWith('data:') ? undefined : 'anonymous'}
                          alt="Preview"
                          className="w-12 h-12 rounded-full object-cover border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => setActiveResume(p => ({ ...p, photoUrl: '' }))}
                          className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-650 text-white rounded-full p-0.5 text-[8px] leading-none"
                          title="Remove photo"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full border border-dashed border-border flex items-center justify-center bg-background/50 text-[10px] text-muted-foreground flex-shrink-0">
                        No Photo
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            if (file.size > 2 * 1024 * 1024) {
                              alert('Please upload a photo smaller than 2MB.');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setActiveResume(p => ({ ...p, photoUrl: event.target?.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                      />
                      <span className="text-[9px] text-muted-foreground block mt-1">Upload photo (Max 2MB)</span>
                    </div>
                  </div>
                </div>

                {/* 3. Name & Role */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Full Name *</label>
                    <input
                      type="text"
                      value={activeResume.name}
                      onChange={(e) => setActiveResume(p => ({ ...p, name: e.target.value }))}
                      placeholder="John Doe"
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:border-primary transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Target Role *</label>
                    <input
                      type="text"
                      value={activeResume.role}
                      onChange={(e) => setActiveResume(p => ({ ...p, role: e.target.value }))}
                      placeholder="Software Engineer"
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:border-primary transition"
                    />
                  </div>
                </div>

                {/* 4. Social Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Email Address *</label>
                    <input
                      type="email"
                      value={activeResume.email}
                      onChange={(e) => setActiveResume(p => ({ ...p, email: e.target.value }))}
                      placeholder="john@example.com"
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:border-primary transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Phone Number *</label>
                    <input
                      type="text"
                      value={activeResume.phone}
                      onChange={(e) => setActiveResume(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+91 9876543210"
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:border-primary transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">LinkedIn Link</label>
                    <input
                      type="text"
                      value={activeResume.linkedin}
                      onChange={(e) => setActiveResume(p => ({ ...p, linkedin: e.target.value }))}
                      placeholder="linkedin.com/in/johndoe"
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:border-primary transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">GitHub Link</label>
                    <input
                      type="text"
                      value={activeResume.github}
                      onChange={(e) => setActiveResume(p => ({ ...p, github: e.target.value }))}
                      placeholder="github.com/johndoe"
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:border-primary transition"
                    />
                  </div>
                </div>

                {/* 5. Summary */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Professional Summary *</label>
                  <textarea
                    rows={3}
                    value={activeResume.summary}
                    onChange={(e) => setActiveResume(p => ({ ...p, summary: e.target.value }))}
                    placeholder="Brief professional profile statement..."
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:border-primary transition"
                  />
                </div>

                {/* 6. Skills */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground block">Skills (Add technical keywords)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                      placeholder="React / Python / SQL"
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-1.5 text-xs focus:border-primary transition"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-3 rounded-xl text-xs"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {activeResume.skills.map((s, idx) => (
                      <span 
                        key={idx} 
                        onClick={() => setActiveResume(p => ({ ...p, skills: p.skills.filter((_, i) => i !== idx) }))}
                        className="bg-card hover:bg-red-500/10 hover:text-red-500 cursor-pointer border border-border px-2 py-0.5 rounded text-[10px] font-semibold text-muted-foreground transition"
                      >
                        {s} ×
                      </span>
                    ))}
                  </div>
                </div>

                {/* 7. Experience */}
                <div className="space-y-2 border-t border-border/60 pt-3">
                  <label className="text-xs font-bold text-muted-foreground block">Work Experience</label>
                  <div className="space-y-2 bg-background/40 p-3 rounded-xl border border-border">
                    <input
                      type="text"
                      value={expInput.company}
                      onChange={(e) => setExpInput(p => ({ ...p, company: e.target.value }))}
                      placeholder="Company Name"
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-[11px]"
                    />
                    <input
                      type="text"
                      value={expInput.role}
                      onChange={(e) => setExpInput(p => ({ ...p, role: e.target.value }))}
                      placeholder="Role (e.g. Intern)"
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-[11px]"
                    />
                    <input
                      type="text"
                      value={expInput.duration}
                      onChange={(e) => setExpInput(p => ({ ...p, duration: e.target.value }))}
                      placeholder="Duration (e.g. Jan 2026 - Present)"
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-[11px]"
                    />
                    <textarea
                      rows={2}
                      value={expInput.description}
                      onChange={(e) => setExpInput(p => ({ ...p, description: e.target.value }))}
                      placeholder="Description of duties/deliverables..."
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={handleAddExperience}
                      className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-1.5 rounded-lg text-[10px]"
                    >
                      Add Experience Block
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                    {activeResume.experience.map((e, idx) => (
                      <div key={idx} className="p-2 bg-background border border-border rounded-lg text-[10px] flex justify-between items-start gap-2">
                        <div>
                          <strong className="text-foreground">{e.company}</strong> ({e.role})
                          <span className="text-muted-foreground block">{e.duration}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveResume(p => ({ ...p, experience: p.experience.filter((_, i) => i !== idx) }))}
                          className="text-red-400 hover:text-red-500"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 8. Projects */}
                <div className="space-y-2 border-t border-border/60 pt-3">
                  <label className="text-xs font-bold text-muted-foreground block">Projects</label>
                  <div className="space-y-2 bg-background/40 p-3 rounded-xl border border-border">
                    <input
                      type="text"
                      value={projInput.title}
                      onChange={(e) => setProjInput(p => ({ ...p, title: e.target.value }))}
                      placeholder="Project Title"
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-[11px]"
                    />
                    <input
                      type="text"
                      value={projInput.technologies}
                      onChange={(e) => setProjInput(p => ({ ...p, technologies: e.target.value }))}
                      placeholder="Technologies Used"
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-[11px]"
                    />
                    <textarea
                      rows={2}
                      value={projInput.description}
                      onChange={(e) => setProjInput(p => ({ ...p, description: e.target.value }))}
                      placeholder="Project Description..."
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-[11px]"
                    />
                    <input
                      type="text"
                      value={projInput.link}
                      onChange={(e) => setProjInput(p => ({ ...p, link: e.target.value }))}
                      placeholder="Project Link (Optional)"
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={handleAddProject}
                      className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-1.5 rounded-lg text-[10px]"
                    >
                      Add Project Block
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                    {activeResume.projects.map((p, idx) => (
                      <div key={idx} className="p-2 bg-background border border-border rounded-lg text-[10px] flex justify-between items-start gap-2">
                        <div>
                          <strong className="text-foreground">{p.title}</strong>
                          <span className="text-muted-foreground block">{p.technologies}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveResume(p => ({ ...p, projects: p.projects.filter((_, i) => i !== idx) }))}
                          className="text-red-400 hover:text-red-500"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 9. Education */}
                <div className="space-y-2 border-t border-border/60 pt-3">
                  <label className="text-xs font-bold text-muted-foreground block">Education</label>
                  <div className="space-y-2 bg-background/40 p-3 rounded-xl border border-border">
                    <input
                      type="text"
                      value={eduInput.institution}
                      onChange={(e) => setEduInput(p => ({ ...p, institution: e.target.value }))}
                      placeholder="University/College"
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-[11px]"
                    />
                    <input
                      type="text"
                      value={eduInput.degree}
                      onChange={(e) => setEduInput(p => ({ ...p, degree: e.target.value }))}
                      placeholder="Degree (e.g. B.Tech CSE)"
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-[11px]"
                    />
                    <input
                      type="text"
                      value={eduInput.duration}
                      onChange={(e) => setEduInput(p => ({ ...p, duration: e.target.value }))}
                      placeholder="Duration (e.g. 2022 - 2026)"
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-[11px]"
                    />
                    <input
                      type="text"
                      value={eduInput.grade}
                      onChange={(e) => setEduInput(p => ({ ...p, grade: e.target.value }))}
                      placeholder="GPA or Percentage (Optional)"
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={handleAddEducation}
                      className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-1.5 rounded-lg text-[10px]"
                    >
                      Add Education Block
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                    {activeResume.education.map((e, idx) => (
                      <div key={idx} className="p-2 bg-background border border-border rounded-lg text-[10px] flex justify-between items-start gap-2">
                        <div>
                          <strong className="text-foreground">{e.institution}</strong>
                          <span className="text-muted-foreground block">{e.degree} • {e.duration}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveResume(p => ({ ...p, education: p.education.filter((_, i) => i !== idx) }))}
                          className="text-red-400 hover:text-red-500"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 10. Achievements */}
                <div className="space-y-2 border-t border-border/60 pt-3">
                  <label className="text-xs font-bold text-muted-foreground block">Achievements</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={achInput}
                      onChange={(e) => setAchInput(e.target.value)}
                      placeholder="e.g. Winner of Smart India Hackathon"
                      className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddAchievement}
                      className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-3 rounded-xl text-xs"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                    {activeResume.achievements.map((a, idx) => (
                      <div key={idx} className="p-2 bg-background border border-border rounded-lg text-[10px] flex justify-between items-start gap-2">
                        <span className="truncate max-w-[80%]">{a}</span>
                        <button
                          type="button"
                          onClick={() => setActiveResume(p => ({ ...p, achievements: p.achievements.filter((_, i) => i !== idx) }))}
                          className="text-red-400 hover:text-red-500"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 11. Certifications */}
                <div className="space-y-2 border-t border-border/60 pt-3">
                  <label className="text-xs font-bold text-muted-foreground block">Certifications</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={certInput}
                      onChange={(e) => setCertInput(e.target.value)}
                      placeholder="AWS Certified Cloud Practitioner"
                      className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddCertification}
                      className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-3 rounded-xl text-xs"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                    {activeResume.certifications.map((c, idx) => (
                      <div key={idx} className="p-2 bg-background border border-border rounded-lg text-[10px] flex justify-between items-start gap-2">
                        <span className="truncate max-w-[80%]">{c}</span>
                        <button
                          type="button"
                          onClick={() => setActiveResume(p => ({ ...p, certifications: p.certifications.filter((_, i) => i !== idx) }))}
                          className="text-red-400 hover:text-red-500"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feedback alert */}
                {creatorMsg && (
                  <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-xs font-bold text-primary">
                    {creatorMsg}
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="button"
                  disabled={savingCreator}
                  onClick={handleSaveResume}
                  className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition disabled:opacity-60"
                >
                  {savingCreator ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Cloud...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Save Resume Draft</span>
                    </>
                  )}
                </button>

              </div>
            </div>

            {/* RIGHT PREVIEW PORTAL: 7/12 cols */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">Live ATS Resume Preview</span>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={analyzing}
                    onClick={handleAnalyzeCreatedResume}
                    className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition disabled:opacity-60"
                    title="Calculate ATS Match score for your built resume"
                  >
                    {analyzing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    <span>{analyzing ? 'Scanning ATS...' : 'Analyze ATS Score'}</span>
                  </button>

                  <button
                    disabled={loadingWord || loadingPDF}
                    onClick={() => handleRequestDownload('word')}
                    className="p-2 bg-card border border-border hover:bg-card/50 text-foreground font-bold rounded-xl text-xs flex items-center space-x-1.5 transition disabled:opacity-60"
                    title="Download editable MS Word document"
                  >
                    {loadingWord ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                    <span>{loadingWord ? 'Downloading Word...' : 'Download Word (.doc)'}</span>
                  </button>

                  <button
                    disabled={loadingPDF}
                    onClick={() => handleRequestDownload('pdf')}
                    className="p-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl text-xs flex items-center space-x-1.5 transition shadow disabled:opacity-60"
                  >
                    {loadingPDF ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Printer className="w-3.5 h-3.5" />
                    )}
                    <span>{loadingPDF ? 'Downloading PDF...' : 'Download PDF'}</span>
                  </button>
                </div>
              </div>

              {/* Editing Advice callout */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] font-semibold text-amber-600">
                💡 **Formatting Tips**: If you want to make manual adjustments or customize margins/spacings easily, download the **Word format** to edit in Microsoft Word or Google Docs!
              </div>

              {/* Responsive Container Wrapper with scaling and centering for small mobile viewports */}
              <div 
                ref={previewContainerRef}
                className="w-full overflow-hidden flex justify-center items-start"
                style={{ height: `${1130 * previewScale}px` }}
              >
                <div 
                  style={{
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top center',
                    width: '800px', // Standard desktop width
                    height: '1130px', // Standard A4 height
                    flexShrink: 0
                  }}
                >
                  <div className="border border-border bg-white text-black p-8 rounded-2xl min-h-[1130px] font-sans shadow-xl text-left" id="printable-resume-preview">
                {/* 1. Classic Layout (ATS Friendly - Enhancv Style) */}
                {activeResume.template === 'classic' && (
                  <div className="space-y-5 text-sm text-gray-900">
                    
                    {/* Header */}
                    <div className="flex items-center space-x-6 border-b-2 border-black pb-4 text-left">
                      {activeResume.photoUrl && (
                        <img 
                          src={getAbsolutePhotoUrl(activeResume.photoUrl)} 
                          crossOrigin={activeResume.photoUrl?.startsWith('data:') ? undefined : 'anonymous'}
                          alt="Profile" 
                          className="w-20 h-20 rounded-full object-cover border border-gray-300 flex-shrink-0" 
                        />
                      )}
                      <div className="flex-1 space-y-1">
                        <h2 className="text-3xl font-black uppercase text-gray-905 tracking-tight leading-none">
                          {activeResume.name || 'YOUR FULL NAME'}
                        </h2>
                        <span className="text-xs font-bold text-gray-750 tracking-wider block mt-1 uppercase">
                          {activeResume.role || 'TARGET PROFESSIONAL ROLE'}
                        </span>
                        
                        {/* Contacts Details */}
                        <div className="text-[10px] text-gray-650 flex flex-wrap justify-start items-center gap-x-3 gap-y-1.5 font-mono pt-1 leading-none">
                          {activeResume.phone && (
                            <span className="flex items-center space-x-1">
                              <span>📞</span>
                              <span>{activeResume.phone}</span>
                            </span>
                          )}
                          {activeResume.email && (
                            <>
                              <span>•</span>
                              <span className="flex items-center space-x-1">
                                <span>📧</span>
                                <span>{activeResume.email}</span>
                              </span>
                            </>
                          )}
                          {activeResume.linkedin && (
                            <>
                              <span>•</span>
                              <span className="flex items-center space-x-1">
                                <span>🔗</span>
                                <span className="break-all">{activeResume.linkedin}</span>
                              </span>
                            </>
                          )}
                          {activeResume.github && (
                            <>
                              <span>•</span>
                              <span className="flex items-center space-x-1">
                                <span>💻</span>
                                <span className="break-all">{activeResume.github}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    {activeResume.summary && (
                      <div className="space-y-1.5">
                        <h3 className="font-extrabold uppercase tracking-wide text-xs border-b border-black pb-0.5 text-center text-gray-950">
                          Summary
                        </h3>
                        <p className="text-[11px] leading-relaxed text-gray-700 text-center mx-auto max-w-2xl">
                          {activeResume.summary}
                        </p>
                      </div>
                    )}

                    {/* Skills */}
                    {activeResume.skills.length > 0 && (
                      <div className="space-y-1.5">
                        <h3 className="font-extrabold uppercase tracking-wide text-xs border-b border-black pb-0.5 text-center text-gray-955">
                          Skills
                        </h3>
                        <div className="space-y-2.5 pt-1">
                          {activeResume.skills.map((s, idx) => {
                            const parts = s.split(':');
                            if (parts.length > 1) {
                              const category = parts[0].trim();
                              const items = parts[1].split(',').map(item => item.trim());
                              return (
                                <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs">
                                  <div className="col-span-4 font-extrabold uppercase text-[10px] text-gray-955 tracking-wider text-left">
                                    {category}
                                  </div>
                                  <div className="col-span-8 flex flex-wrap gap-1 text-left">
                                    {items.map((item, i) => (
                                      <span key={i} className="border border-gray-300 px-2 py-0.5 rounded text-[9px] font-bold text-gray-800 bg-gray-50/50">
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <div key={idx} className="text-left">
                                <span className="border border-gray-300 px-2 py-0.5 rounded text-[9px] font-bold text-gray-800 bg-gray-50/50 inline-block mr-1 mb-1">
                                  {s}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Experience */}
                    {activeResume.experience.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-extrabold uppercase tracking-wide text-xs border-b border-black pb-0.5 text-center text-gray-955">
                          Experience
                        </h3>
                        <div className="space-y-3">
                          {activeResume.experience.map((exp, i) => (
                            <div key={i} className="text-[11px] space-y-0.5">
                              <div className="flex justify-between items-baseline font-bold text-gray-955">
                                <span>{exp.company}</span>
                                <span>{exp.duration}</span>
                              </div>
                              <div className="flex justify-between items-baseline text-blue-600 font-semibold italic text-[10px]">
                                <span>{exp.role}</span>
                              </div>
                              <p className="text-gray-700 leading-relaxed whitespace-pre-line pl-2 mt-0.5">
                                {exp.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Projects */}
                    {activeResume.projects.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-extrabold uppercase tracking-wide text-xs border-b border-black pb-0.5 text-center text-gray-955">
                          Projects
                        </h3>
                        <div className="space-y-3">
                          {activeResume.projects.map((proj, i) => (
                            <div key={i} className="text-[11px] space-y-0.5">
                              <div className="flex justify-between items-baseline font-bold text-gray-955">
                                <span>{proj.title}</span>
                                {proj.link && <span className="font-mono text-[9px] text-blue-500 font-medium">{proj.link}</span>}
                              </div>
                              <div className="text-[10px] text-gray-650 font-semibold block">
                                Tech Stack: {proj.technologies}
                              </div>
                              <p className="text-gray-700 leading-relaxed whitespace-pre-line pl-2 mt-0.5">
                                {proj.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {activeResume.education.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-extrabold uppercase tracking-wide text-xs border-b border-black pb-0.5 text-center text-gray-955">
                          Education
                        </h3>
                        <div className="space-y-2">
                          {activeResume.education.map((edu, i) => (
                            <div key={i} className="text-[11px] space-y-0.5">
                              <div className="flex justify-between items-baseline font-bold text-gray-955">
                                <span>{edu.institution}</span>
                                <span>{edu.duration}</span>
                              </div>
                              <div className="flex justify-between items-baseline text-gray-650 text-[10px]">
                                <span>{edu.degree}</span>
                                {edu.grade && <span>Grade: {edu.grade}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Combined Achievements & Certifications */}
                    {(activeResume.achievements.length > 0 || activeResume.certifications.length > 0) && (
                      <div className="space-y-3">
                        <h3 className="font-extrabold uppercase tracking-wide text-xs border-b border-black pb-0.5 text-center text-gray-955">
                          Achievements & Certifications
                        </h3>
                        
                        {/* Achievements Grid */}
                        {activeResume.achievements.length > 0 && (
                          <div className={`grid gap-4 pt-1 ${
                            activeResume.achievements.length === 1 
                              ? 'grid-cols-1 max-w-sm mx-auto' 
                              : activeResume.achievements.length === 2 
                                ? 'grid-cols-2' 
                                : 'grid-cols-3'
                          }`}>
                            {activeResume.achievements.map((ach, idx) => {
                              const parts = ach.split(/\s*[-—–]\s*/);
                              const title = parts[0].trim();
                              const desc = parts.slice(1).join(' — ').trim();
                              return (
                                <div key={idx} className="text-center p-3 border border-gray-200 rounded-xl bg-gray-50/50 space-y-1">
                                  <span className="text-blue-500 text-base block">⭐</span>
                                  <strong className="font-bold text-[10px] text-gray-950 uppercase tracking-wide block leading-tight">
                                    {title}
                                  </strong>
                                  {desc && <p className="text-[9px] text-gray-650 leading-snug">{desc}</p>}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Certifications List */}
                        {activeResume.certifications.length > 0 && (
                          <div className="text-center text-[11px] text-gray-750 font-medium space-y-1.5 pt-2">
                            {activeResume.certifications.map((c, i) => (
                              <div key={i} className="flex items-center justify-center space-x-1.5">
                                <span className="text-blue-500 text-xs">🏆</span>
                                <span>{c}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                )}

                {/* 2. Modern Creative Layout */}
                {activeResume.template === 'modern' && (
                  <div className="grid grid-cols-12 gap-6 text-sm text-gray-850">
                    {/* Left Sidebar details */}
                    <div className="col-span-4 bg-gray-50 p-4 rounded-xl space-y-4 border-r border-gray-100">
                      {activeResume.photoUrl && (
                        <img 
                          src={getAbsolutePhotoUrl(activeResume.photoUrl)} 
                          crossOrigin={activeResume.photoUrl?.startsWith('data:') ? undefined : 'anonymous'}
                          alt="Profile" 
                          className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-indigo-500 mb-1" 
                        />
                      )}
                      <div className="text-[10px] space-y-2 text-gray-700">
                        <span className="font-bold text-gray-950 uppercase tracking-wider block border-b border-gray-200 pb-1">Contact Details</span>
                        <div className="space-y-1 font-medium leading-normal">
                          <p className="break-all">📧 {activeResume.email || 'email@example.com'}</p>
                          <p>📞 {activeResume.phone || '+91 0000000000'}</p>
                          {activeResume.linkedin && <p className="break-all">🔗 {activeResume.linkedin}</p>}
                          {activeResume.github && <p className="break-all">💻 {activeResume.github}</p>}
                        </div>
                      </div>

                      {activeResume.skills.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-gray-950 uppercase tracking-wider block border-b border-gray-200 pb-1">Skills Area</span>
                          <div className="flex flex-wrap gap-1">
                            {activeResume.skills.map((s, i) => (
                              <span key={i} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[9px] font-bold">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeResume.education.length > 0 && (
                        <div className="space-y-3">
                          <span className="text-[10px] font-bold text-gray-950 uppercase tracking-wider block border-b border-gray-200 pb-1">Education</span>
                          {activeResume.education.map((edu, i) => (
                            <div key={i} className="text-[10px] space-y-0.5">
                              <strong className="text-gray-900 block">{edu.institution}</strong>
                              <span className="text-gray-600 block">{edu.degree}</span>
                              <span className="text-gray-500 block">{edu.duration}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right Main body */}
                    <div className="col-span-8 space-y-5 text-[11px] leading-relaxed">
                      <div>
                        <h2 className="text-2xl font-black text-indigo-650 tracking-tight leading-none">{activeResume.name || 'YOUR FULL NAME'}</h2>
                        <span className="text-xs font-bold text-gray-600 tracking-wider block mt-1">{activeResume.role || 'TARGET PROFESSIONAL ROLE'}</span>
                      </div>

                      {activeResume.summary && (
                        <div className="space-y-1">
                          <h3 className="font-extrabold uppercase tracking-wide text-xs text-indigo-600 border-b border-gray-150 pb-0.5">Professional Summary</h3>
                          <p className="text-gray-700">{activeResume.summary}</p>
                        </div>
                      )}

                      {activeResume.experience.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="font-extrabold uppercase tracking-wide text-xs text-indigo-600 border-b border-gray-150 pb-0.5">Experience</h3>
                          <div className="space-y-3">
                            {activeResume.experience.map((exp, i) => (
                              <div key={i} className="space-y-1">
                                <div className="flex justify-between font-bold text-gray-950">
                                  <span>{exp.company} — {exp.role}</span>
                                  <span className="text-gray-500">{exp.duration}</span>
                                </div>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{exp.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeResume.projects.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="font-extrabold uppercase tracking-wide text-xs text-indigo-600 border-b border-gray-150 pb-0.5">Projects</h3>
                          <div className="space-y-3">
                            {activeResume.projects.map((proj, i) => (
                              <div key={i} className="space-y-0.5">
                                <div className="flex justify-between font-bold text-gray-950">
                                  <span>{proj.title} ({proj.technologies})</span>
                                  {proj.link && <span className="font-mono text-[9px] text-indigo-500">{proj.link}</span>}
                                </div>
                                <p className="text-gray-700">{proj.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeResume.achievements.length > 0 && (
                        <div className="space-y-1">
                          <h3 className="font-extrabold uppercase tracking-wide text-xs text-indigo-600 border-b border-gray-150 pb-0.5">Achievements</h3>
                          <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                            {activeResume.achievements.map((ach, i) => <li key={i}>{ach}</li>)}
                          </ul>
                        </div>
                      )}

                      {activeResume.certifications.length > 0 && (
                        <div className="space-y-1">
                          <h3 className="font-extrabold uppercase tracking-wide text-xs text-indigo-600 border-b border-gray-150 pb-0.5">Certifications</h3>
                          <p className="text-gray-800 font-medium">{activeResume.certifications.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Minimal Tech Layout */}
                {activeResume.template === 'minimal' && (
                  <div className="space-y-5 text-sm text-gray-900 leading-normal">
                    {/* Header */}
                    <div className="flex items-start justify-between border-b border-gray-300 pb-4">
                      <div className="space-y-1">
                        <h2 className="text-3xl font-extrabold leading-none tracking-tight">{activeResume.name || 'YOUR FULL NAME'}</h2>
                        <span className="text-xs font-bold text-indigo-600 tracking-widest block uppercase">{activeResume.role || 'TARGET PROFESSIONAL ROLE'}</span>
                      </div>
                      <div className="text-right text-[10px] text-gray-600 font-semibold space-y-0.5">
                        <p>{activeResume.email || 'email@example.com'}</p>
                        <p>{activeResume.phone || '+91 0000000000'}</p>
                        {activeResume.linkedin && <p>{activeResume.linkedin}</p>}
                        {activeResume.github && <p>{activeResume.github}</p>}
                      </div>
                    </div>

                    {/* Summary */}
                    {activeResume.summary && (
                      <div className="grid grid-cols-4 gap-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 col-span-1">About Me</span>
                        <p className="text-[11px] leading-relaxed text-gray-700 col-span-3">{activeResume.summary}</p>
                      </div>
                    )}

                    {/* Skills */}
                    {activeResume.skills.length > 0 && (
                      <div className="grid grid-cols-4 gap-4 border-t border-gray-100 pt-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 col-span-1">Expertise</span>
                        <div className="col-span-3 flex flex-wrap gap-2">
                          {activeResume.skills.map((s, i) => (
                            <span key={i} className="border border-gray-300 px-2 py-0.5 rounded text-[9px] font-bold text-gray-750">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience */}
                    {activeResume.experience.length > 0 && (
                      <div className="grid grid-cols-4 gap-4 border-t border-gray-100 pt-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 col-span-1">Experience</span>
                        <div className="col-span-3 space-y-3">
                          {activeResume.experience.map((exp, i) => (
                            <div key={i} className="text-[11px] space-y-0.5">
                              <div className="flex justify-between font-bold text-gray-950">
                                <span>{exp.company} — {exp.role}</span>
                                <span className="text-gray-500">{exp.duration}</span>
                              </div>
                              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{exp.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Projects */}
                    {activeResume.projects.length > 0 && (
                      <div className="grid grid-cols-4 gap-4 border-t border-gray-100 pt-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 col-span-1">Projects</span>
                        <div className="col-span-3 space-y-3">
                          {activeResume.projects.map((proj, i) => (
                            <div key={i} className="text-[11px] space-y-0.5">
                              <div className="flex justify-between font-bold text-gray-950">
                                <span>{proj.title} ({proj.technologies})</span>
                                {proj.link && <span className="font-mono text-[9px] text-gray-500">{proj.link}</span>}
                              </div>
                              <p className="text-gray-700 leading-relaxed">{proj.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {activeResume.education.length > 0 && (
                      <div className="grid grid-cols-4 gap-4 border-t border-gray-100 pt-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 col-span-1">Education</span>
                        <div className="col-span-3 space-y-2">
                          {activeResume.education.map((edu, i) => (
                            <div key={i} className="text-[11px] flex justify-between font-semibold text-gray-900">
                              <span>{edu.institution} — {edu.degree} {edu.grade && `(${edu.grade})`}</span>
                              <span>{edu.duration}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Achievements */}
                    {activeResume.achievements.length > 0 && (
                      <div className="grid grid-cols-4 gap-4 border-t border-gray-100 pt-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 col-span-1">Honors</span>
                        <ul className="list-disc list-inside text-[11px] text-gray-700 col-span-3 space-y-0.5">
                          {activeResume.achievements.map((ach, i) => <li key={i}>{ach}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* Certifications */}
                    {activeResume.certifications.length > 0 && (
                      <div className="grid grid-cols-4 gap-4 border-t border-gray-100 pt-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 col-span-1">Certifications</span>
                        <p className="text-[11px] leading-relaxed text-gray-800 col-span-3 font-semibold">{activeResume.certifications.join(', ')}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
          </div>
        </div>
      )}
    </div>
  );
}
