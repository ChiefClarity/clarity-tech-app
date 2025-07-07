export const handleAIError = (error: any, fallbackMessage: string = 'AI analysis failed') => {
  console.error('AI Error:', error);
  
  if (error.response) {
    // API responded with error
    return error.response.data?.message || error.response.data?.error || fallbackMessage;
  } else if (error.request) {
    // Request made but no response
    return 'Network error - please check your connection';
  } else {
    // Something else happened
    return error.message || fallbackMessage;
  }
};