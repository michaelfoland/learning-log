export const rowData = [
  {
    row: 'date',
    rowHeadingText: 'On...',
    lockState: 'locked',
    inputDetails: {
      type: 'date',
      additionalClasses: [],
      placeholder: ''
    },
    hasCharMonitor: false,
    hasPromptCloud: false,
    promptCloudMembers: []
  },
  {
    row: 'source',
    rowHeadingText: 'I learned something from...',
    lockState: 'unlocked',
    inputDetails: {
      type: 'text',
      additionalClasses: ['short-input'],
      placeholder: 'source'
    },
    hasCharMonitor: true,
    hasPromptCloud: true,
    promptCloudMembers: []    
  },
  {
    row: 'subject',
    rowHeadingText: 'I learned about...',
    lockState: 'unlocked',
    inputDetails: {
      type: 'text',
      additionalClasses: ['short-input'],
      placeholder: 'subject'
    },
    hasCharMonitor: true,
    hasPromptCloud: true,
    promptCloudMembers: []    
  },
  {
    row: 'title',
    rowHeadingText: 'Specifically, I learned...',
    lockState: 'unlocked',
    inputDetails: {
      type: 'text',
      additionalClasses: ['long-input'],
      placeholder: 'some cool stuff'
    },
    hasCharMonitor: true,
    hasPromptCloud: false,
    promptCloudMembers: []    
  },
  {
    row: 'details',
    rowHeadingText: 'Here are the details:',
    lockState: 'unlocked',
    inputDetails: {
      type: 'textarea',
      rows: 5, // may not need this
      cols: 50, // may not need this
      additionalClasses: [],
      placeholder: 'just so I don\'t forget'
    },
    hasCharMonitor: false,
    hasPromptCloud: false,
    promptCloudMembers: []    
  }    
]