$file = 'services\app-api\src\modules\community\community.controller.ts'
$content = Get-Content $file -Raw
$pattern = '(?s)getMyWords\(@CurrentUser\(''id''\) userId: string, @Query\(''filter''\) filter\?: string\) \{\s*return this\.communityService\.getMyWords\(userId, filter\);\s*\}'
$replacement = 'getMyWords(@CurrentUser(''id'') userId: string, @Query(''filter'') filter?: string, @Query(''languageId'') languageId?: string) { return this.communityService.getMyWords(userId, filter, languageId); }'
$content = $content -replace $pattern, $replacement
Set-Content -NoNewline -Path $file -Value $content

$file2 = 'services\app-api\src\modules\community\community.service.ts'
$content2 = Get-Content $file2 -Raw
$pattern2 = '(?s)async getMyWords\(userId: string, filter\?: string\) \{\s*const where: any = \{ userId \};\s*if \(filter === ''FAVORITES''\) \{\s*where\.isFavorite = true;\s*\} else if \(filter === ''MASTERED''\) \{\s*where\.status = VocabStatus\.MASTERED;\s*\} else if \(filter === ''LEARNING''\) \{\s*where\.status = \{ in: \[VocabStatus\.NEW, VocabStatus\.LEARNING, VocabStatus\.REVIEW\] \};\s*\}'
$replacement2 = 'async getMyWords(userId: string, filter?: string, languageId?: string) {
    const where: any = { userId };
    
    if (languageId && languageId !== ''ALL'') {
      where.vocabulary = { languageId };
    }

    if (filter === ''FAVORITES'') {
      where.isFavorite = true;
    } else if (filter === ''MASTERED'') {
      where.status = VocabStatus.MASTERED;
    } else if (filter === ''LEARNING'') {
      where.status = { in: [VocabStatus.NEW, VocabStatus.LEARNING, VocabStatus.REVIEW] };
    }'
$content2 = $content2 -replace $pattern2, $replacement2
Set-Content -NoNewline -Path $file2 -Value $content2
