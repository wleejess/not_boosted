import { useState, useEffect } from 'react'
import Skeleton from './Skeleton'

interface Props {
  characterClass: string
  size?: 'sm' | 'md' | 'lg'
  imgUrl?: string | null
}

const SIZE_PX: Record<'sm' | 'md' | 'lg', number> = { sm: 48, md: 80, lg: 120 }

const CLASS_COLORS: Record<string, string> = {
  warrior: 'bg-red-900 text-red-300',
  mage:    'bg-purple-900 text-purple-300',
  archer:  'bg-green-900 text-green-300',
  thief:   'bg-yellow-900 text-yellow-300',
  pirate:  'bg-blue-900 text-blue-300',
}

function getClassFamily(cls: string): string {
  const c = cls.toLowerCase()
  if (/dark.?knight|hero|paladin|aran|kaiser|adele|mihile|dawn.?warrior|blaster|demon|hayato|zero|ark/.test(c)) return 'warrior'
  if (/mage|wizard|bishop|evan|luminous|kanna|lara|hoyoung|illium|kinesis|blaze|battle.?mage/.test(c)) return 'mage'
  if (/bow|archer|marksman|mercedes|wind|pathfinder|kain/.test(c)) return 'archer'
  if (/night|shadow|assassin|bandit|dual|phantom|night.?walk|xenon|cadena|khali/.test(c)) return 'thief'
  return 'pirate'
}

export default function CharacterSprite({ characterClass, size = 'md', imgUrl }: Props) {
  const px = SIZE_PX[size]
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    setLoaded(false)
    setErrored(false)
  }, [imgUrl])

  const family = getClassFamily(characterClass)
  const colorClass = CLASS_COLORS[family] ?? CLASS_COLORS.pirate
  const initial = characterClass.charAt(0).toUpperCase()

  if (!imgUrl || errored) {
    return (
      <div
        style={{ width: px, height: px, minWidth: px }}
        className={`rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${colorClass}`}
      >
        {initial}
      </div>
    )
  }

  return (
    <div style={{ width: px, height: px, minWidth: px }} className="relative shrink-0">
      {!loaded && <Skeleton className="absolute inset-0 rounded-md" />}
      <img
        key={imgUrl}
        src={imgUrl}
        width={px}
        height={px}
        loading="lazy"
        alt={characterClass}
        className={`object-contain w-full h-full transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
      />
    </div>
  )
}
