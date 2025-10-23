import * as mobilenet from '@tensorflow-models/mobilenet';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export interface AIVerificationResult {
  isValid: boolean;
  confidence: number;
  detectedObjects: string[];
  suggestions: string[];
  needsManualReview: boolean;
}


const FARM_RELATED_KEYWORDS = [
  'plant', 'crop', 'field', 'farm', 'agriculture', 'soil', 'garden',
  'vegetable', 'fruit', 'tree', 'harvest', 'greenhouse', 'irrigation',
  'tractor', 'tool', 'hoe', 'shovel', 'seed', 'grain', 'corn', 'wheat',
  'rice', 'potato', 'tomato', 'carrot', 'cabbage', 'lettuce'
];

const COMMUNITY_WORK_KEYWORDS = [
  'person', 'people', 'group', 'community', 'work', 'activity',
  'construction', 'building', 'road', 'bridge', 'well', 'water',
  'school', 'clinic', 'meeting', 'gathering'
];

let mobilenetModel: mobilenet.MobileNet | null = null;
let cocoSsdModel: cocoSsd.ObjectDetection | null = null;


export async function loadAIModels(): Promise<void> {
  try {
    console.log('Loading AI models...');

    
    const [mobilenet_m, cocossd_m] = await Promise.all([
      mobilenet.load(),
      cocoSsd.load()
    ]);

    mobilenetModel = mobilenet_m;
    cocoSsdModel = cocossd_m;

    console.log('AI models loaded successfully');
  } catch (error) {
    console.error('Error loading AI models:', error);
    throw new Error('Failed to load AI models. Please refresh the page.');
  }
}


export async function verifyImage(
  imageFile: File,
  verificationType: 'farming' | 'community'
): Promise<AIVerificationResult> {
  try {
    
    if (!mobilenetModel || !cocoSsdModel) {
      await loadAIModels();
    }

    
    const imageElement = await createImageElement(imageFile);

    
    const [classifications, detections] = await Promise.all([
      mobilenetModel!.classify(imageElement),
      cocoSsdModel!.detect(imageElement)
    ]);

    
    const detectedObjects = detections.map(d => d.class);
    const classificationLabels = classifications.map(c => c.className.toLowerCase());

    
    const allLabels = [...detectedObjects, ...classificationLabels];

    
    const relevantKeywords = verificationType === 'farming'
      ? FARM_RELATED_KEYWORDS
      : [...FARM_RELATED_KEYWORDS, ...COMMUNITY_WORK_KEYWORDS];

    
    const matchedKeywords = allLabels.filter(label =>
      relevantKeywords.some(keyword => label.toLowerCase().includes(keyword))
    );

    
    const topConfidence = classifications[0]?.probability || 0;
    const matchRatio = matchedKeywords.length / allLabels.length;
    const overallConfidence = (topConfidence + matchRatio) / 2;

    
    const isValid = matchedKeywords.length > 0 && overallConfidence > 0.3;
    const needsManualReview = overallConfidence < 0.6 || matchedKeywords.length === 0;

    
    const suggestions = generateSuggestions(
      isValid,
      matchedKeywords,
      detectedObjects,
      verificationType
    );

    
    URL.revokeObjectURL(imageElement.src);

    return {
      isValid,
      confidence: overallConfidence,
      detectedObjects: [...new Set(detectedObjects)], 
      suggestions,
      needsManualReview
    };

  } catch (error) {
    console.error('Error verifying image:', error);
    return {
      isValid: false,
      confidence: 0,
      detectedObjects: [],
      suggestions: ['AI verification failed. Manual review required.'],
      needsManualReview: true
    };
  }
}


export async function verifyMultipleImages(
  imageFiles: File[],
  verificationType: 'farming' | 'community'
): Promise<AIVerificationResult[]> {
  const results = await Promise.all(
    imageFiles.map(file => verifyImage(file, verificationType))
  );
  return results;
}


export function getOverallVerification(results: AIVerificationResult[]): {
  isValid: boolean;
  averageConfidence: number;
  needsManualReview: boolean;
} {
  if (results.length === 0) {
    return { isValid: false, averageConfidence: 0, needsManualReview: true };
  }

  const validCount = results.filter(r => r.isValid).length;
  const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  const needsManualReview = results.some(r => r.needsManualReview) || validCount < results.length / 2;

  return {
    isValid: validCount >= results.length / 2, 
    averageConfidence,
    needsManualReview
  };
}


function createImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}


function generateSuggestions(
  isValid: boolean,
  matchedKeywords: string[],
  detectedObjects: string[],
  verificationType: 'farming' | 'community'
): string[] {
  const suggestions: string[] = [];

  if (!isValid) {
    suggestions.push(
      `Image does not appear to show ${verificationType} activities.`
    );
    suggestions.push(
      'Please upload clear photos showing relevant work or activities.'
    );
  } else if (matchedKeywords.length < 2) {
    suggestions.push(
      'Image verification passed but confidence is low.'
    );
    suggestions.push(
      'Consider uploading additional photos for better verification.'
    );
  } else {
    suggestions.push(
      `AI detected ${verificationType}-related content: ${matchedKeywords.slice(0, 3).join(', ')}`
    );
  }

  if (detectedObjects.length === 0) {
    suggestions.push(
      'No clear objects detected. Ensure good lighting and focus.'
    );
  }

  return suggestions;
}


export function areModelsLoaded(): boolean {
  return mobilenetModel !== null && cocoSsdModel !== null;
}