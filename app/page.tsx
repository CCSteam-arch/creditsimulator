// This is your new main application file.
// It combines all our logic from App.jsx into the Next.js page.tsx format.
"use client"; // <--- This is CRITICAL for Next.js. It must be the very first line.

import React, { useState, useEffect, useCallback, ChangeEvent, ReactNode } from 'react'; // Added ChangeEvent, ReactNode types
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'; // Added FirebaseApp type
import { getAuth, signInAnonymously, onAuthStateChanged, Auth } from 'firebase/auth'; // Added Auth type
import { getFirestore, addDoc, collection, serverTimestamp, setLogLevel, Firestore } from 'firebase/firestore'; // Added Firestore type
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faPiggyBank, faPercentage, faSpinner, faExclamationCircle, faCheckCircle, faShieldAlt, faUserPlus, faHandHoldingUsd, IconDefinition } from '@fortawesome/free-solid-svg-icons'; // Added IconDefinition type

// --- Firebase Initialization ---
let firebaseApp: FirebaseApp | undefined; // Typed Firebase variables
let auth: Auth | undefined;
let db: Firestore | undefined;

try {
    const firebaseConfigString = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
    if (!firebaseConfigString) {
        throw new Error("Firebase config is not defined. Check your .env.local file.");
    }
    const firebaseConfig = JSON.parse(firebaseConfigString);
    
    if (!getApps().length) {
        firebaseApp = initializeApp(firebaseConfig);
    } else {
        firebaseApp = getApp();
    }
    
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);
    console.log("Firebase initialized successfully.");
} catch (e) {
    // Check if e is an instance of Error before accessing message
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error("Firebase Initialization Error:", errorMessage);
}

// --- TypeScript Prop Definitions ---
interface FormInputProps {
    id: string;
    label: string;
    type?: string;
    value: string | number; // Allow number for type="number"
    onChange: (e: ChangeEvent<HTMLInputElement>) => void; // Specific event type
    min?: string;
    max?: string;
    step?: string;
    required?: boolean;
    pattern?: string;
    title?: string;
}

interface FormSelectProps {
    id: string;
    label: string;
    value: string | number; // Allow number if needed
    onChange: (e: ChangeEvent<HTMLSelectElement>) => void; // Specific event type
    children: ReactNode; // Type for children
    required?: boolean;
}

interface ToolCheckboxProps {
    id: string;
    label: string;
    description: string;
    checked: boolean;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void; // Specific event type
    icon: IconDefinition; // Type for FontAwesome icon
}

interface InfoIconProps {
    icon: IconDefinition; // Type for FontAwesome icon
    className?: string;
}

interface KpiCardProps {
    title: string;
    value: string | number;
    subValue?: string;
    icon: IconDefinition; // Type for FontAwesome icon
    color?: 'blue' | 'green' | 'orange' | 'purple'; // Specific color options
}

interface ScoreChartProps {
    start: number;
    dip: number;
    stabilization: number;
    recovery: number;
    end: number;
    timeline: number;
}

// --- Helper Components ---

const FormInput: React.FC<FormInputProps> = ({ id, label, type = 'number', value, onChange, min, max, step, required = true, pattern, title }) => (
    <div className="flex-1 min-w-[200px]">
        <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1">
            {label}
        </label>
        <input
            type={type}
            id={id}
            name={id}
            value={value}
            onChange={onChange}
            min={min}
            max={max}
            step={step}
            pattern={pattern}
            title={title}
            required={required}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder={label.replace(' (Years)', '').replace(' ($)', '')}
        />
    </div>
);

const FormSelect: React.FC<FormSelectProps> = ({ id, label, value, onChange, children, required = true }) => (
    <div className="flex-1 min-w-[200px]">
        <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1">
            {label}
        </label>
        <select
            id={id}
            name={id}
            value={value}
            onChange={onChange}
            required={required}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        >
            {children}
        </select>
    </div>
);

const ToolCheckbox: React.FC<ToolCheckboxProps> = ({ id, label, description, checked, onChange, icon }) => (
    <div className="relative flex items-start p-4 bg-white rounded-lg border border-gray-200 shadow-sm transition-all hover:shadow-md has-[:checked]:ring-2 has-[:checked]:ring-blue-500 has-[:checked]:border-blue-500">
        <FontAwesomeIcon icon={icon} className="w-5 h-5 text-blue-600 mt-1" />
        <div className="ml-4 text-sm flex-1">
            <label htmlFor={id} className="font-semibold text-gray-800 cursor-pointer">
                {label}
            </label>
            <p className="text-gray-500">{description}</p>
        </div>
        <div className="flex items-center h-5">
            <input
                id={id}
                name={id}
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="focus:ring-blue-500 h-5 w-5 text-blue-600 border-gray-300 rounded"
            />
        </div>
    </div>
);

const InfoIcon: React.FC<InfoIconProps> = ({ icon, className = "w-6 h-6" }) => (
    <FontAwesomeIcon icon={icon} className={className} />
);

const KpiCard: React.FC<KpiCardProps> = ({ title, value, subValue, icon, color = 'blue' }) => {
    const colorClasses = {
        blue: 'from-blue-500 to-indigo-600',
        green: 'from-green-500 to-teal-600',
        orange: 'from-orange-500 to-red-600',
        purple: 'from-purple-500 to-indigo-600',
    };

    const iconBgClasses = {
        blue: 'bg-blue-100 text-blue-700',
        green: 'bg-green-100 text-green-700',
        orange: 'bg-orange-100 text-orange-700',
        purple: 'bg-purple-100 text-purple-700',
    };
    
    // Ensure color is a valid key before accessing colorClasses/iconBgClasses
    const validColor = color && colorClasses[color] ? color : 'blue'; 

    return (
        <div className={`relative flex flex-col bg-white p-6 rounded-2xl shadow-lg border border-gray-100 overflow-hidden`}>
            <div className={`absolute top-0 left-0 h-2 w-full bg-gradient-to-r ${colorClasses[validColor]}`}></div>
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-gray-600">{title}</span>
                <div className={`p-2 rounded-full ${iconBgClasses[validColor]}`}>
                    <FontAwesomeIcon icon={icon} className="w-5 h-5" />
                </div>
            </div>
            <div>
                <div className="text-4xl font-bold text-gray-900">{value}</div>
                {subValue && (
                    <div className="text-sm font-medium text-gray-500">{subValue}</div>
                )}
            </div>
        </div>
    );
};


const ScoreChart: React.FC<ScoreChartProps> = ({ start, dip, stabilization, recovery, end, timeline }) => {
    const totalGain = (end - dip) || 1;
    const dipTime = timeline * 0.1; 
    const stabilizationTime = timeline * 0.25;
    const recoveryTime = timeline * 0.75;
    
    const calculateY = (score: number) => Math.max(0, Math.min(100, ((score - dip) / totalGain) * 100));

    const points = [
        { score: start, time: 0, label: "Start", timeLabel: "0 mo", x: 0, y: calculateY(start) },
        { score: dip, time: dipTime, label: "Dip", timeLabel: `${Math.round(dipTime)} mo`, x: 10, y: 0 },
        { score: stabilization, time: stabilizationTime, label: "Stabilization", timeLabel: `${Math.round(stabilizationTime)} mo`, x: 25, y: calculateY(stabilization) },
        { score: recovery, time: recoveryTime, label: "Recovery", timeLabel: `${Math.round(recoveryTime)} mo`, x: 75, y: calculateY(recovery) },
        { score: end, time: timeline, label: "Projected", timeLabel: `${timeline} mo`, x: 100, y: 100 }
    ];

    const pathData = `M 0,${100 - points[0].y} C 5,${100 - points[0].y} 5,${100 - points[1].y} 10,${100 - points[1].y} S 20,${100 - points[2].y} 25,${100 - points[2].y} S 50,${100 - points[3].y} 75,${100 - points[3].y} S 95,${100 - points[4].y} 100,${100 - points[4].y}`;

    return (
        <div className="p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Your Score Recovery Journey</h3>
            <p className="text-sm text-gray-600 mb-6">This timeline models your FICO score from its potential low point to its projected goal over {timeline} months.</p>
            <div className="relative h-64 w-full">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="absolute w-full border-t border-dashed border-gray-300" style={{ bottom: `${i * 25}%` }}></div>
                ))}
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: 'rgb(59, 130, 246)', stopOpacity: 0.2 }} />
                            <stop offset="100%" style={{ stopColor: 'rgb(59, 130, 246)', stopOpacity: 0 }} />
                        </linearGradient>
                    </defs>
                    <path d={`${pathData} L 100,100 L 0,100 Z`} fill="url(#chartGradient)" />
                    <path d={pathData} fill="none" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
                </svg>
                {points.map((p) => (
                    <div key={p.label} className="absolute" style={{ left: `${p.x}%`, bottom: `${p.y}%`, transform: 'translate(-50%, 50%)' }}>
                        <div className="relative group">
                            <div className="w-4 h-4 bg-white border-4 border-blue-600 rounded-full cursor-pointer"></div>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-3 bg-gray-900 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                <span className="font-bold text-lg">{p.score} FICO</span>
                                <span className="block text-sm text-blue-300">{p.label}</span>
                                <span className="block text-xs text-gray-400">@{p.timeLabel}</span>
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-gray-900 -mb-2"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between text-xs font-medium text-gray-500 mt-3 pt-2 border-t border-gray-200">
                <span>Start</span>
                <span className="hidden sm:block">Stabilization</span>
                <span className="hidden sm:block">Recovery</span>
                <span>Projected</span>
            </div>
        </div>
    );
};

// Define the type for the user data state
interface UserData {
    ficoScore: number | ''; // Allow empty string for initial state
    totalDebt: number | '';
    monthlyIncome: number | '';
    utilization: number | ''; // This is likely a number representing percentage later
    accountsEnrolling: number | '';
    positiveAccounts: number | '';
    oldestAccountAge: number | '';
    programTimeline: number;
    totalCreditLimit: number | '';
    scenarioType: 'pre-enrollment' | 'progress-tracker';
    monthsInProgram: number | ''; // Allow empty for optional fields
    settledAccounts: number | ''; // Allow empty for optional fields
    programPhase: 'negotiation' | 'settlement' | 'graduation';
    securedCard: boolean;
    creditBuilder: boolean;
    authorizedUser: boolean;
    email: string;
    firstName: string;
    phone: string; // Assuming phone is string, adjust if needed
}

// Define the type for the simulation results state
interface SimulationResults {
    initialScore: number;
    lowPointScore: number;
    projectedScore: number;
    scoreGain: number;
    recoveryTime: string;
    postDTI: string;
    savings: number;
    impactPenalty: number;
    recoveryMonths: number;
    weights: Record<string, number>; // Adjust if weights structure is known
    milestoneDipScore: number;
    milestoneStabilizationScore: number;
    milestoneRecoveryScore: number;
    utilization: number | ''; // Carry over from input
}


// --- Main Application Component ---
export default function Home() {
    
    const defaultUserData: UserData = { // Apply the UserData type
        ficoScore: '',
        totalDebt: '',
        monthlyIncome: '',
        utilization: '',
        accountsEnrolling: '',
        positiveAccounts: '',
        oldestAccountAge: '',
        programTimeline: 36,
        totalCreditLimit: '',
        scenarioType: 'pre-enrollment',
        monthsInProgram: '', // Use empty string for optional number inputs
        settledAccounts: '',
        programPhase: 'negotiation',
        securedCard: true,
        creditBuilder: false,
        authorizedUser: false,
        email: '',
        firstName: '',
        phone: ''
    };

    // --- State Management ---
    const [userId, setUserId] = useState<string | null>(null); // Type userId
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [userData, setUserData] = useState<UserData>(defaultUserData); // Type userData state
    const [results, setResults] = useState<SimulationResults | null>(null); // Type results state
    const [error, setError] = useState<string | null>(null); // Type error state
    const [isLoading, setIsLoading] = useState(false);

    // --- Firebase Auth Effect ---
    useEffect(() => {
        if (!auth) {
            console.warn("Auth instance not available. Skipping auth state check.");
            setIsAuthReady(true); 
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            let currentUserId: string; // Ensure type consistency
            if (!user) {
                console.log("No user found, attempting anonymous sign-in...");
                try {
                    const cred = await signInAnonymously(auth);
                    currentUserId = cred.user.uid;
                } catch (e) {
                    console.error("Firebase Anonymous Sign-in Error:", e);
                    currentUserId = crypto.randomUUID(); // Fallback
                }
            } else {
                currentUserId = user.uid;
            }
            console.log("User ID set:", currentUserId);
            setUserId(currentUserId);
            setIsAuthReady(true);
        });

        return () => unsubscribe();
    }, []); 

    // --- Utility Functions ---
    const showError = (message: string) => { // Type the message parameter
        setError(message);
        setTimeout(() => setError(null), 5000);
    };

    // Correctly type the event for input, select, and checkbox
    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { 
        const { name, value, type } = e.target;
        
        let processedValue: string | number | boolean; // Union type

        if (type === 'checkbox') {
             // Need to cast target to HTMLInputElement for 'checked'
            processedValue = (e.target as HTMLInputElement).checked;
        } else if (type === 'number') {
            processedValue = value === '' ? '' : Number(value); 
        } else if (type === 'range') { // Handle range input specifically
             processedValue = Number(value);
        } else {
            processedValue = value;
        }

        setUserData(prev => ({ ...prev, [name]: processedValue }));
    }, []);

    // --- Core Simulation Logic ---
    const calculateWeights = useCallback((
        ficoScore: number, 
        totalDebt: number, 
        monthlyIncome: number, 
        positiveAccounts: number, 
        oldestAccountAge: number, 
        totalCreditLimit: number
    ) => { // Add types to parameters
        const baseWeights: Record<string, number> = { // Use Record for index signature
            paymentHistory: 0.35,
            utilization: 0.30,
            accountAge: 0.15,
            creditMix: 0.10,
            newCredit: 0.10
        };
        // ... (rest of the calculation logic remains the same) ...
        if (ficoScore >= 740) {
            baseWeights.paymentHistory = 0.25;
            baseWeights.utilization = 0.40;
            baseWeights.accountAge = 0.20;
        } else if (ficoScore <= 580) {
            baseWeights.paymentHistory = 0.45;
            baseWeights.utilization = 0.25;
            baseWeights.newCredit = 0.15;
        }
        const dti = monthlyIncome > 0 ? (totalDebt / (monthlyIncome * 12)) : 1;
        if (dti > 0.45) {
            baseWeights.utilization = Math.min(0.45, baseWeights.utilization + 0.05);
            baseWeights.paymentHistory = Math.max(0.25, baseWeights.paymentHistory - 0.05);
        }
        if (totalCreditLimit > 0) {
            const trueOverallUtilization = (totalDebt / totalCreditLimit) * 100;
            if (trueOverallUtilization < 30) {
                baseWeights.utilization = Math.max(0.20, baseWeights.utilization - 0.05);
            }
        }
        if (positiveAccounts > 0) {
            baseWeights.paymentHistory = Math.max(0.30, baseWeights.paymentHistory - 0.05);
            baseWeights.creditMix = Math.min(0.20, baseWeights.creditMix + 0.05);
        }
        if (oldestAccountAge < 4) {
            baseWeights.accountAge = Math.max(0.05, baseWeights.accountAge - 0.05);
            baseWeights.newCredit = Math.min(0.20, baseWeights.newCredit + 0.05);
        } else if (oldestAccountAge > 10) {
            baseWeights.accountAge = Math.min(0.25, baseWeights.accountAge + 0.05);
        }
        const sum = Object.values(baseWeights).reduce((a, b) => a + b, 0);
        for (const key in baseWeights) {
            baseWeights[key] = parseFloat((baseWeights[key] / sum).toFixed(4));
        }
        return baseWeights;
    }, []);

    const calculateWorstCaseImpact = useCallback((data: UserData, weights: Record<string, number>) => { // Type parameters
        let drop = 0;
        const utilization = Number(data.utilization) || 100;
        const utilizationFactor = Math.max(0, (100 - utilization) / 10);
        drop += utilizationFactor * 5 * (weights.utilization * 2);
        const severityFactor = Math.max(0, (Number(data.ficoScore) - 500) / 20);
        drop += severityFactor * 5;
        drop -= (Number(data.positiveAccounts) || 0) * 10;
        if (Number(data.oldestAccountAge) > 10) {
            drop -= 15;
        }
        return Math.min(150, Math.max(20, Math.round(drop)));
    }, []);

    const runSimulation = useCallback((data: UserData): SimulationResults => { // Type parameter and return value
        // Convert potentially empty strings to numbers (or 0) for calculations
        const numericData = {
            ficoScore: Number(data.ficoScore) || 0,
            totalDebt: Number(data.totalDebt) || 0,
            monthlyIncome: Number(data.monthlyIncome) || 0,
            utilization: Number(data.utilization) || 0,
            accountsEnrolling: Number(data.accountsEnrolling) || 0,
            positiveAccounts: Number(data.positiveAccounts) || 0,
            oldestAccountAge: Number(data.oldestAccountAge) || 0,
            programTimeline: Number(data.programTimeline) || 36,
            totalCreditLimit: Number(data.totalCreditLimit) || 0,
            monthsInProgram: Number(data.monthsInProgram) || 0,
             // Keep boolean flags as they are
            securedCard: data.securedCard,
            creditBuilder: data.creditBuilder,
            authorizedUser: data.authorizedUser,
            // Keep scenario type and phase
            scenarioType: data.scenarioType,
            programPhase: data.programPhase,
        };
        
        const initialScore = numericData.ficoScore > 300 ? numericData.ficoScore : 500;
        const weights = calculateWeights(
            initialScore,
            numericData.totalDebt,
            numericData.monthlyIncome,
            numericData.positiveAccounts,
            numericData.oldestAccountAge,
            numericData.totalCreditLimit
        );
        let lowPointScore: number, projectedScore: number;
        let recoveryMonths = numericData.programTimeline;
        let impactPenalty = 0;
        if (numericData.scenarioType === 'pre-enrollment') {
            impactPenalty = calculateWorstCaseImpact(data, weights); // Pass original data if needed
            lowPointScore = Math.max(300, initialScore - impactPenalty);
        } else {
            lowPointScore = initialScore;
            recoveryMonths = Math.max(12, numericData.programTimeline - numericData.monthsInProgram);
            impactPenalty = 0;
        }
        let totalPotentialGain = 0;
        totalPotentialGain += weights.utilization * 250;
        const historyGain = (weights.paymentHistory * 150) * (recoveryMonths / 36);
        totalPotentialGain += historyGain;
        totalPotentialGain += (weights.accountAge * 50) * (recoveryMonths / 36);
        let toolGain = 0;
        if (numericData.securedCard) toolGain += 30;
        if (numericData.creditBuilder) toolGain += 25;
        if (numericData.authorizedUser) toolGain += 10;
        totalPotentialGain += toolGain;
        projectedScore = Math.min(850, Math.round(lowPointScore + totalPotentialGain));
        const debtSavings = numericData.totalDebt * 0.55;
        const postProgramDebt = numericData.totalDebt - debtSavings;
        const annualPostDebtPayment = postProgramDebt * 0.05;
        const monthlyPostDebtPayment = annualPostDebtPayment / 12;
        const postDTI = numericData.monthlyIncome > 0 ? (monthlyPostDebtPayment / numericData.monthlyIncome) * 100 : 0;
        const totalGain = projectedScore - lowPointScore;
        const stabilizationScore = Math.min(initialScore, lowPointScore + Math.round(totalGain * 0.15));
        const recoveryScore = lowPointScore + Math.round(totalGain * 0.65);
        
        // Ensure the returned object matches the SimulationResults interface
        return {
            initialScore,
            lowPointScore,
            projectedScore,
            scoreGain: projectedScore - initialScore,
            recoveryTime: `${recoveryMonths} months`,
            postDTI: Math.min(50, postDTI).toFixed(1),
            savings: debtSavings,
            impactPenalty,
            recoveryMonths,
            weights,
            milestoneDipScore: lowPointScore,
            milestoneStabilizationScore: stabilizationScore,
            milestoneRecoveryScore: recoveryScore,
            utilization: data.utilization // Pass original utilization back
        };
    }, [calculateWeights, calculateWorstCaseImpact]);

    const saveSimulation = useCallback(async (simulationData: UserData, simulationResults: SimulationResults) => { // Type parameters
        if (!db || !userId || !isAuthReady) {
            console.warn("Database or User ID not ready. Cannot save simulation.");
            alert("Could not save results. DB not connected."); 
            return;
        }
        const appId = process.env.NEXT_PUBLIC_APP_ID || 'default-app-id';
        
        // Use assertion as db, userId, isAuthReady are checked
        const simulationRef = collection(db!, 'artifacts', appId, 'users', userId!, 'simulations');
        try {
            await addDoc(simulationRef, {
                userId: userId,
                timestamp: serverTimestamp(),
                input: simulationData, // Save the full user data
                results: simulationResults,
            });
            console.log("Simulation saved successfully!");
            alert("Results saved!");
        } catch (e) {
            console.error("Error adding document: ", e);
            alert("Could not save results due to a database error.");
        }
    }, [db, userId, isAuthReady]); // Add dependencies

    // --- Navigation Handlers ---
    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setResults(null);
        }
    };

    const handleNext = () => {
        if (currentStep === 1) {
            const { ficoScore, totalDebt, accountsEnrolling, monthlyIncome, utilization, positiveAccounts, oldestAccountAge, totalCreditLimit } = userData;
            const numFico = parseFloat(String(ficoScore)); // Convert to string first
            const numTotalDebt = parseFloat(String(totalDebt));
            const numAccounts = parseInt(String(accountsEnrolling));
            const numIncome = parseFloat(String(monthlyIncome));
            const numPositive = parseInt(String(positiveAccounts));
            const numAge = parseInt(String(oldestAccountAge));
            const numLimit = parseInt(String(totalCreditLimit));

            if (isNaN(numFico) || numFico < 300 || numFico > 850) {
                showError("Please enter a valid FICO Score (300-850)."); return;
            }
            if (isNaN(numTotalDebt) || numTotalDebt <= 1000) {
                showError("Please enter a valid Total Debt (over $1,000)."); return;
            }
            if (isNaN(numAccounts) || numAccounts < 1) {
                showError("Please enter at least 1 account for enrollment."); return;
            }
            if (isNaN(numIncome) || numIncome <= 0) {
                showError("Please enter a valid Monthly Income."); return;
            }
            if (utilization === '') {
                showError("Please select your Credit Utilization range."); return;
            }
             if (isNaN(numPositive) || numPositive < 0) {
                showError("Please enter a valid number of positive accounts (0 or more)."); return;
            }
            if (isNaN(numAge) || numAge < 0) {
                showError("Please enter a valid age for your oldest account (0 or more)."); return;
            }
            if (isNaN(numLimit) || numLimit < 0) { 
                 showError("Please enter a valid Total Credit Limit (0 or more). This is crucial for accuracy."); return;
            }
        }
        if (currentStep === 2) {
             const numMonths = parseInt(String(userData.monthsInProgram)); // Convert to string
             if (userData.scenarioType === 'progress-tracker') {
                if (isNaN(numMonths) || numMonths <= 0) { 
                    showError("Please enter how many months you've been in the program."); return;
                }
             }
        }
        if (currentStep === 3) {
            calculateAndShowResults();
            return;
        }
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
            // Check if window is defined before scrolling (for SSR safety)
            if (typeof window !== 'undefined') {
                 window.scrollTo(0, 0);
            }
        }
    };

    const calculateAndShowResults = () => {
        setIsLoading(true);
        setTimeout(() => {
            try { 
                const calculatedResults = runSimulation(userData);
                setResults(calculatedResults);
                // Ensure saveSimulation is called only if results are calculated
                if (isAuthReady && db && calculatedResults) { 
                    saveSimulation(userData, calculatedResults);
                }
            } catch (simError) {
                console.error("Error during simulation:", simError);
                showError("An error occurred during calculation. Please check inputs.");
            } finally {
                setIsLoading(false);
                setCurrentStep(4);
                 if (typeof window !== 'undefined') {
                    window.scrollTo(0, 0);
                 }
            }
        }, 1500);
    };

    // --- Step Components (Defined inside the main component) ---
     // Use React.FC for Step components for clarity, although not strictly necessary
    const Step1Profile: React.FC = () => (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-extrabold text-gray-900">Your Financial Snapshot</h2>
                <p className="mt-2 text-lg text-gray-600">Tell us where you're starting from. This helps us build your unique projection.</p>
            </div>
            <div className="p-6 md:p-8 bg-white rounded-2xl shadow-xl border border-gray-100 space-y-6">
                <div className="flex flex-wrap gap-6">
                    <FormInput id="ficoScore" label="Current FICO Score" type="number" value={userData.ficoScore} onChange={handleChange} min="300" max="850" />
                    <FormInput id="totalDebt" label="Total Debt for Resolution ($)" type="number" value={userData.totalDebt} onChange={handleChange} min="1000" step="500" />
                </div>
                <div className="flex flex-wrap gap-6">
                    <FormInput id="accountsEnrolling" label="# of Accounts Enrolling" type="number" value={userData.accountsEnrolling} onChange={handleChange} min="1" max="50" />
                    <FormInput id="monthlyIncome" label="Gross Monthly Income ($)" type="number" value={userData.monthlyIncome} onChange={handleChange} min="0" step="100" />
                </div>
                <hr className="border-gray-200" />
                <h3 className="text-xl font-semibold text-gray-800">Your Credit Profile</h3>
                <p className="text-sm text-gray-500 -mt-4">This info helps our algorithm weigh the factors that impact your score.</p>
                <div className="flex flex-wrap gap-6">
                     <FormSelect id="utilization" label="Credit Utilization (Enrolled Accounts)" value={userData.utilization} onChange={handleChange}>
                        <option value="">Select a range...</option>
                        <option value="30">0% - 30%</option>
                        <option value="50">30% - 50%</option>
                        <option value="70">50% - 70%</option>
                        <option value="90">70% - 90%</option>
                        <option value="100">90% - 100% (Maxed)</option>
                    </FormSelect>
                    <FormInput id="totalCreditLimit" label="Total Credit Limit (All Accounts $)" type="number" value={userData.totalCreditLimit} onChange={handleChange} min="0" step="100" />
                </div>
                <div className="flex flex-wrap gap-6">
                    <FormInput id="positiveAccounts" label="# of Positive Accounts" type="number" value={userData.positiveAccounts} onChange={handleChange} min="0" max="50" title="Accounts you'll keep paying on time (auto loans, mortgage, other credit cards)." />
                    <FormInput id="oldestAccountAge" label="Oldest Account Age (Years)" type="number" value={userData.oldestAccountAge} onChange={handleChange} min="0" max="100" title="The age of your oldest open credit account." />
                </div>
            </div>
        </div>
    );

    const Step2Scenario: React.FC = () => (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-extrabold text-gray-900">Your Program & Timeline</h2>
                <p className="mt-2 text-lg text-gray-600">Let's set your goals and timeline.</p>
            </div>
            <div className="p-6 md:p-8 bg-white rounded-2xl shadow-xl border border-gray-100 space-y-6">
                <h3 className="text-xl font-semibold text-gray-800">1. Select Your Scenario</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className={`flex flex-col p-5 rounded-lg border-2 cursor-pointer transition-all ${userData.scenarioType === 'pre-enrollment' ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500' : 'bg-white border-gray-300 hover:bg-gray-50'}`}>
                        <input type="radio" name="scenarioType" value="pre-enrollment" checked={userData.scenarioType === 'pre-enrollment'} onChange={handleChange} className="form-radio h-5 w-5 text-blue-600" />
                        <span className="mt-2 text-lg font-bold text-gray-900">New Client Projection</span>
                        <span className="text-sm text-gray-600">I'm considering enrolling and want to see a full projection.</span>
                    </label>
                    <label className={`flex flex-col p-5 rounded-lg border-2 cursor-pointer transition-all ${userData.scenarioType === 'progress-tracker' ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500' : 'bg-white border-gray-300 hover:bg-gray-50'}`}>
                        <input type="radio" name="scenarioType" value="progress-tracker" checked={userData.scenarioType === 'progress-tracker'} onChange={handleChange} className="form-radio h-5 w-5 text-blue-600" />
                        <span className="mt-2 text-lg font-bold text-gray-900">Existing Client Tracker</span>
                        <span className="text-sm text-gray-600">I'm already in the program and want to track my progress.</span>
                    </label>
                </div>
                {userData.scenarioType === 'progress-tracker' && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4 animate-fadeIn">
                        <h4 className="text-md font-semibold text-blue-800">Progress Details</h4>
                        <div className="flex flex-wrap gap-6">
                            <FormInput id="monthsInProgram" label="Months in Program" type="number" value={userData.monthsInProgram} onChange={handleChange} min="0" />
                            <FormInput id="settledAccounts" label="# of Settled Accounts" type="number" value={userData.settledAccounts} onChange={handleChange} min="0" />
                        </div>
                        <FormSelect id="programPhase" label="Current Program Phase" value={userData.programPhase} onChange={handleChange}>
                            <option value="negotiation">Negotiation</option>
                            <option value="settlement">Settlement</option>
                            <option value="graduation">Graduation</option>
                        </FormSelect>
                    </div>
                )}
                <hr className="border-gray-200" />
                <h3 className="text-xl font-semibold text-gray-800">2. Select Your Timeline</h3>
                 <div className="space-y-2">
                    <label htmlFor="programTimeline" className="block text-sm font-semibold text-gray-700">Expected Program Timeline</label>
                    <input type="range" id="programTimeline" name="programTimeline" min="12" max="60" step="12" value={userData.programTimeline} onChange={handleChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-thumb-blue" />
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>12 mo</span>
                        <span>24 mo</span>
                        <span>36 mo</span>
                        <span>48 mo</span>
                        <span>60 mo</span>
                    </div>
                    <p className="text-center text-lg font-bold text-blue-700 mt-2">{userData.programTimeline} Months</p>
                </div>
            </div>
        </div>
    );

    const Step3Tools: React.FC = () => (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-extrabold text-gray-900">Credit Building Tools</h2>
                <p className="mt-2 text-lg text-gray-600">Select the tools you plan to use. This adds positive history and accelerates your recovery.</p>
            </div>
            <div className="p-6 md:p-8 bg-white rounded-2xl shadow-xl border border-gray-100 space-y-6">
                <ToolCheckbox id="securedCard" label="Secured Credit Card" description="Establishes new positive payment history. We recommend this for all clients." checked={userData.securedCard} onChange={handleChange} icon={faShieldAlt} />
                <ToolCheckbox id="creditBuilder" label="Credit Builder Loan" description="A small loan that builds credit as you save. Great for building a credit mix." checked={userData.creditBuilder} onChange={handleChange} icon={faHandHoldingUsd} />
                <ToolCheckbox id="authorizedUser" label="Authorized User" description="Become a user on a trusted person's account to 'piggyback' on their good history." checked={userData.authorizedUser} onChange={handleChange} icon={faUserPlus} />
            </div>
            <div className="p-6 bg-blue-50 border border-blue-200 rounded-2xl">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <InfoIcon icon={faExclamationCircle} className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-lg font-semibold text-blue-900">Why does this matter?</h3>
                        <p className="mt-1 text-blue-800">While the program resolves your old debt, these tools build a *new* positive credit file. This combination of removing negatives and adding positives is the fastest path to a strong score.</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const Step4Results: React.FC = () => {
        if (!results) {
            return (
                <div className="text-center p-10">
                    <h2 className="text-2xl font-bold text-gray-800">Error</h2>
                    <p className="text-gray-600">Could not calculate results. Please go back and check your inputs.</p>
                </div>
            );
        }
        const { initialScore, projectedScore, scoreGain, recoveryTime, postDTI, savings, impactPenalty, utilization, milestoneDipScore, milestoneStabilizationScore, milestoneRecoveryScore } = results;
        return (
            <div className="space-y-8">
                <div className="text-center">
                    <h2 className="text-4xl font-black text-gray-900">Your Credit Comeback Plan</h2>
                    <p className="mt-2 text-xl text-gray-600">Here is your personalized {recoveryTime} projection.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <KpiCard title="Projected Score" value={projectedScore} subValue={`A ${scoreGain > 0 ? '+' : ''}${scoreGain} point change`} icon={faChartLine} color="blue" />
                    <KpiCard title="Est. Debt Savings" value={`$${Math.round(savings).toLocaleString()}`} subValue="Approx. 55% of enrolled debt" icon={faPiggyBank} color="green" />
                     <KpiCard title="Post-Program DTI" value={`${postDTI}%`} subValue="Debt-to-Income Ratio" icon={faPercentage} color="purple" />
                </div>
                <ScoreChart start={initialScore} dip={milestoneDipScore} stabilization={milestoneStabilizationScore} recovery={milestoneRecoveryScore} end={projectedScore} timeline={Number(recoveryTime.split(' ')[0])} />
                <div className="p-6 md:p-8 bg-white rounded-2xl shadow-xl border border-gray-100 space-y-4">
                     <h3 className="text-2xl font-bold text-gray-900 text-center">Save Your Results</h3>
                     <p className="text-gray-600 text-center">Enter your info to save this projection to your profile and have a copy sent to your email.</p>
                     <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label htmlFor="firstName" className="sr-only">First Name</label>
                            <input type="text" name="firstName" id="firstName" value={userData.firstName} onChange={handleChange} placeholder="First Name" className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label htmlFor="emailCapture" className="sr-only">Email</label>
                            <input type="email" name="email" id="emailCapture" value={userData.email} onChange={handleChange} placeholder="Email Address" className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        </div>
                     </div>
                     <button
                        onClick={() => {
                            if (isAuthReady && db && results) { // Ensure results is not null
                                saveSimulation(userData, results);
                            } else {
                                console.warn("Save failed: DB not ready or results missing.");
                                // Use console.error or a more robust error handling in production
                                alert("Could not save results. DB not connected or calculation failed.");
                            }
                        }}
                        className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition-all text-lg"
                    >
                        Save & Email My Results
                    </button>
                </div>
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl space-y-6">
                    <h3 className="text-xl font-semibold text-gray-800">How This Works</h3>
                    <div className="flex items-start">
                        <InfoIcon icon={faExclamationCircle} className="w-10 h-10 text-orange-500" />
                        <div className="ml-3">
                            <h4 className="font-semibold text-gray-800">The "Dip" Phase (Months 0-6)</h4>
                            <p className="text-sm text-gray-600">If you're new, your score may temporarily drop by {impactPenalty > 0 ? `~${impactPenalty} points` : 'a small amount'} as accounts stop aging positively. This is normal and the foundation for recovery. Your positive accounts help cushion this.</p>
                        </div>
                    </div>
                     <div className="flex items-start">
                        <InfoIcon icon={faChartLine} className="w-10 h-10 text-blue-500" />
                        <div className="ml-3">
                            <h4 className="font-semibold text-gray-800">The "Recovery" Phase (Months 6-24)</h4>
                            <p className="text-sm text-gray-600">As your debts are settled, your utilization plummets from {utilization || 'your current'}% to near 0%. This causes a major score increase. Your credit-building tools also start adding positive payment history.</p>
                        </div>
                    </div>
                     <div className="flex items-start">
                        <InfoIcon icon={faCheckCircle} className="w-10 h-10 text-green-500" />
                        <div className="ml-3">
                            <h4 className="font-semibold text-gray-800">The "Growth" Phase (Months 24+)</h4>
                            <p className="text-sm text-gray-600">With debts resolved, your file is clean. Your score now grows steadily from your new positive accounts aging and your commitment to on-time payments.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    /**
     * Renders the current step component based on `currentStep`.
     */
    const renderCurrentStep = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center p-20 space-y-4">
                    <FontAwesomeIcon icon={faSpinner} className="w-16 h-16 text-blue-500 animate-spin" />
                    <h2 className="text-2xl font-bold text-gray-800">Calculating Your Future...</h2>
                    <p className="text-gray-600">Our AI is analyzing your profile and running projections.</p>
                </div>
            );
        }
        switch (currentStep) {
            case 1: return <Step1Profile />;
            case 2: return <Step2Scenario />;
            case 3: return <Step3Tools />;
            case 4: return <Step4Results />;
            default: return <Step1Profile />;
        }
    };

    // --- Main Render ---
    return (
        <div className="bg-gray-100 min-h-screen font-sans antialiased">
            <header className="bg-white shadow-md sticky top-0 z-50">
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex-shrink-0 flex items-center">
                            <span className="text-2xl font-bold text-blue-700">CreDebtFree</span>
                        </div>
                        <div className="hidden md:block">
                            <span className="text-sm font-medium text-gray-500">Your Personal Credit Simulator</span>
                        </div>
                    </div>
                </nav>
            </header>

            {error && (
                <div className="fixed top-20 right-5 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50 animate-fadeIn" role="alert" onClick={() => setError(null)}>
                    <span className="font-bold">Error:</span> {error}
                </div>
            )}

            <main className="max-w-4xl mx-auto py-12 px-4">
                {currentStep < 4 && !isLoading && (
                    <div className="mb-8">
                        <div className="relative pt-1">
                            <div className="overflow-hidden h-3 mb-2 text-xs flex rounded-full bg-blue-200">
                                <div
                                    style={{ width: `${(currentStep / 3) * 100}%` }}
                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-500"
                                ></div>
                            </div>
                            <div className="flex justify-between text-sm font-semibold text-gray-600">
                                <span className={currentStep >= 1 ? 'text-blue-600' : ''}>Profile</span>
                                <span className={currentStep >= 2 ? 'text-blue-600' : ''}>Scenario</span>
                                <span className={currentStep >= 3 ? 'text-blue-600' : ''}>Tools</span>
                                <span>Results</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="transition-opacity duration-500">
                    {renderCurrentStep()}
                </div>

                {!isLoading && (
                     <div className="mt-12 flex justify-between">
                        <button
                            onClick={handlePrevious}
                            disabled={currentStep === 1 || currentStep === 4}
                            className={`px-8 py-3 rounded-lg font-bold text-lg shadow-md transition-all ${
                                (currentStep === 1 || currentStep === 4)
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-white text-gray-800 hover:bg-gray-100 border border-gray-300'
                            }`}
                        >
                            Back
                        </button>
                        
                        {currentStep < 4 && (
                            <button
                                onClick={handleNext}
                                className="px-8 py-3 rounded-lg font-bold text-lg shadow-lg text-white bg-blue-600 hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                {currentStep === 3 ? 'Calculate Results' : 'Next Step'}
                            </button>
                        )}

                        {currentStep === 4 && (
                             <button
                                onClick={() => {
                                    setCurrentStep(1);
                                    setResults(null);
                                    setUserData(defaultUserData);
                                }}
                                className="px-8 py-3 rounded-lg font-bold text-lg shadow-lg text-white bg-blue-600 hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Start New Simulation
                            </button>
                        )}
                    </div>
                )}
            </main>

            <footer className="bg-white mt-16 border-t border-gray-200">
                <div className="max-w-7xl mx-auto py-6 px-4 text-center text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} CreDebtFree.com. All rights reserved.</p>
                    <p className="mt-1">This simulator is for informational purposes only and does not constitute financial advice or a guarantee of results.</p>
                </div>
            </footer>
        </div>
    );
}