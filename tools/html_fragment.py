"""Read source markup without the robots directive for its standalone URL."""

SOURCE_NOINDEX = '<meta name="robots" content="noindex">\n'


def read_fragment(path):
    source = path.read_text(encoding='utf-8')
    if not source.startswith(SOURCE_NOINDEX):
        raise ValueError(f'{path}: missing noindex for the source fragment')
    return source.removeprefix(SOURCE_NOINDEX)
