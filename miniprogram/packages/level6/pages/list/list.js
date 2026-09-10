// CET6 词库列表页
const { createVocabListPage } = require('../../../../utils/vocab-list-page');
const { WORDS } = require('../../words');

Page(createVocabListPage('CET6', { WORDS }));
