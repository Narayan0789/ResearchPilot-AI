import { JobPosting } from '../models/JobPosting.js';

// Normalized technical skills mapping for live feed tags
const TECH_SKILLS = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'golang', 'rust', 'ruby', 'php',
  'react', 'react.js', 'vue', 'angular', 'node.js', 'express', 'next.js', 'django', 'flask',
  'spring boot', 'html5', 'css3', 'tailwind css', 'bootstrap', 'mongodb', 'postgresql', 'mysql',
  'redis', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'git', 'github', 'ci/cd', 'linux',
  'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'sql', 'nosql', 'graphql', 'rest api',
  'algorithms', 'system design', 'microservices'
];

function extractSkillsFromJob(job) {
  const combined = `${job.title} ${job.description || ''} ${(job.tags || []).join(' ')}`.toLowerCase();
  const matched = new Set();

  for (const skill of TECH_SKILLS) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-zA-Z0-9+#])${escaped}(?![a-zA-Z0-9+#])`, 'i');
    if (regex.test(combined)) {
      matched.add(skill);
    }
  }

  // Fallbacks based on common titles if few tags found
  if (matched.size === 0) {
    if (combined.includes('frontend')) {
      matched.add('javascript');
      matched.add('react');
      matched.add('html5');
    } else if (combined.includes('backend')) {
      matched.add('python');
      matched.add('node.js');
      matched.add('sql');
    } else if (combined.includes('data') || combined.includes('ai') || combined.includes('ml')) {
      matched.add('python');
      matched.add('machine learning');
      matched.add('sql');
    } else {
      matched.add('javascript');
      matched.add('python');
      matched.add('git');
    }
  }

  return Array.from(matched).slice(0, 6);
}

function stripHtml(html = '') {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sync fresh tech job openings from real-world live hiring feed (Remotive API)
 */
export async function syncLiveTechJobs(limit = 15) {
  try {
    const response = await fetch(`https://remotive.com/api/remote-jobs?category=software-dev&limit=${limit}`, {
      headers: { 'User-Agent': 'SmartCampus-AI-CareerHub/1.0' }
    });

    if (!response.ok) {
      throw new Error(`Live jobs feed responded with HTTP status ${response.status}`);
    }

    const json = await response.json();
    const liveJobs = json.jobs || [];

    if (!Array.isArray(liveJobs) || liveJobs.length === 0) {
      return { success: true, count: 0, message: 'No new openings in live feed.' };
    }

    let syncedCount = 0;

    for (const item of liveJobs.slice(0, limit)) {
      if (!item.title || !item.company_name || !item.url) continue;

      const rawDescription = stripHtml(item.description);
      const description = rawDescription.length > 280
        ? rawDescription.slice(0, 277) + '...'
        : rawDescription || 'Exciting software engineering opportunity with scalable architecture.';

      const requiredSkills = extractSkillsFromJob(item);
      const deadline = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);

      await JobPosting.findOneAndUpdate(
        { externalId: `remotive_${item.id}` },
        {
          title: item.title,
          company: item.company_name,
          location: item.candidate_required_location || 'Worldwide / Remote',
          employmentType: item.job_type === 'contract' ? 'Contract' : 'Full-time',
          description,
          requiredSkills,
          preferredSkills: ['docker', 'git', 'system design'],
          minCgpa: 6.5,
          salaryRange: item.salary && item.salary.trim() ? item.salary : '$75,000 - $95,000 / ₹15-22 LPA',
          deadline,
          applyUrl: item.url,
          source: 'live_feed',
          externalId: `remotive_${item.id}`,
          active: true
        },
        { upsert: true, new: true }
      );

      syncedCount++;
    }

    const totalActive = await JobPosting.countDocuments({ active: true });
    return {
      success: true,
      syncedCount,
      totalActive,
      message: `Successfully synchronized ${syncedCount} live hiring openings.`
    };
  } catch (error) {
    console.error('[Live Job Sync Warning]:', error.message);
    return {
      success: false,
      syncedCount: 0,
      message: error.message
    };
  }
}
