// CET4 词库列表页
const { createVocabListPage } = require('../../../../utils/vocab-list-page');
const { WORDS } = require('../../words');

Page(createVocabListPage('CET4', { WORDS }));
