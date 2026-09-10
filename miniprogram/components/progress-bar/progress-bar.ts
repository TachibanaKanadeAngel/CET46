Component({
  options: {
    styleIsolation: 'shared'
  },
  properties: {
    percent: {
      type: Number,
      value: 0,
    },
    type: {
      type: String,
      value: 'normal',
    },
    label: {
      type: String,
      value: '',
    },
    showPercent: {
      type: Boolean,
      value: true,
    },
  },
  data: {
    typeClass: '',
  },
  observers: {
    'type, percent': function(type, percent) {
      let extra = '';
      if (type === 'fuel' && percent < 30) {
        extra = ' sv-alert-low-fuel';
      } else if (type === 'heat' && percent > 80) {
        extra = ' sv-alert-high-heat';
      }
      this.setData({ typeClass: `sv-${type}${extra}` });
    },
  },
});
